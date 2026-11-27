const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(process.env.FORGE_SITE || 'public');
const port = 4173;
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8'
};

(async () => {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${port}`).pathname);
    const file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403).end(); return;
    }
    const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
    fs.readFile(target, (err, data) => {
      if (err) { res.writeHead(404).end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const failures = [];
  try {
    for (const viewport of [{ width: 390, height: 844, name: 'mobile' }, { width: 1365, height: 900, name: 'desktop' }]) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      page.setDefaultTimeout(8000);
      page.on('pageerror', error => failures.push(`${viewport.name}: ${error.message}`));
      page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) failures.push(`${viewport.name} console: ${msg.text()}`); });
      page.on('requestfailed', req => failures.push(`${viewport.name} request failed: ${req.url()} :: ${req.failure()?.errorText || 'unknown'}`));
      try {
        await page.goto(`http://127.0.0.1:${port}/#/programme`, { waitUntil: 'domcontentloaded' });
        await page.getByRole('heading', { name: 'Séance' }).waitFor();
        await page.locator('.forge-seance-tab').nth(0).waitFor();
        if (await page.locator('#menu a').count() !== 4) throw new Error('La navigation principale ne contient pas exactement 4 rubriques.');
        if (await page.locator('.forge-seance-tab').count() !== 3) throw new Error('Les 3 onglets de Séance ne sont pas présents.');
        const hubLayout = await page.evaluate(() => {
          const nav = document.querySelector('.forge-seance-tabs');
          const active = nav && nav.querySelector('[aria-current="page"]');
          const style = nav ? getComputedStyle(nav) : null;
          return {
            sticky: style && style.position === 'sticky',
            columns: style && style.gridTemplateColumns.split(' ').length,
            activeLabel: active && active.textContent.trim(),
            overflow: nav && nav.scrollWidth > nav.clientWidth + 1
          };
        });
        if (!hubLayout.sticky || hubLayout.columns !== 3 || hubLayout.activeLabel !== 'Programme' || hubLayout.overflow) {
          throw new Error('La navigation responsive de Séance est incorrecte : ' + JSON.stringify(hubLayout));
        }
        const editButton = page.getByRole('button', { name: 'Modifier' }).first();
        const editButtonLayout = await editButton.evaluate(button => {
          const style = getComputedStyle(button);
          return { whiteSpace: style.whiteSpace, fits: button.scrollWidth <= button.clientWidth + 1 };
        });
        if (editButtonLayout.whiteSpace !== 'nowrap' || !editButtonLayout.fits) {
          throw new Error('Le bouton Modifier doit rester lisible sur une seule ligne : ' + JSON.stringify(editButtonLayout));
        }
        const actionButtonsLayout = await page.evaluate(() => {
          const buttons = [...document.querySelectorAll('.forge-seance-panel button')];
          const create = buttons.find(button => button.textContent.includes('Nouvelle séance'));
          const regenerate = buttons.find(button => button.textContent.includes('Régénérer le programme'));
          if (!create || !regenerate) return { found: false };
          const a = create.getBoundingClientRect();
          const b = regenerate.getBoundingClientRect();
          return { found: true, overlap: a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom };
        });
        if (!actionButtonsLayout.found || actionButtonsLayout.overlap) {
          throw new Error('Les actions Nouvelle séance / Régénérer ne doivent pas se chevaucher : ' + JSON.stringify(actionButtonsLayout));
        }
        await page.screenshot({ path: `/tmp/forge-seance-${viewport.name}-programme.png`, fullPage: true });

        await page.getByRole('link', { name: 'Exercices' }).click();
        await page.waitForURL('**/#/exercices');
        await page.getByPlaceholder('Rechercher un exercice').waitFor();
        const firstExercise = page.locator('.forge-seance-panel .liste a.ligne').first();
        await firstExercise.waitFor();
        const exerciseName = await firstExercise.locator('strong').innerText();
        await page.screenshot({ path: `/tmp/forge-seance-${viewport.name}-exercices.png`, fullPage: true });
        await firstExercise.click();
        await page.waitForURL('**/#/exercice/**');
        await page.getByRole('heading', { name: exerciseName }).waitFor();
        await page.getByRole('button', { name: '← Retour' }).click();
        await page.waitForURL('**/#/exercices');
        await page.getByPlaceholder('Rechercher un exercice').waitFor();

        await page.getByRole('link', { name: 'Suivi' }).click();
        await page.waitForURL('**/#/suivi');
        await page.getByText('Rien à afficher pour l’instant.').waitFor();
        await page.screenshot({ path: `/tmp/forge-seance-${viewport.name}-suivi.png`, fullPage: true });

        await page.getByRole('link', { name: 'Programme' }).click();
        await page.waitForURL('**/#/programme');
        await page.locator('.forge-seance-panel h2').first().waitFor();

        /* Initialise une séance locale réaliste pour tester les champs avancés. */
        await page.evaluate(() => {
          const app = window.FM.app;
          const exId = Object.keys(window.FM.EX)[0];
          const item = window.FM.item(exId, app.etat.profil);
          Object.assign(item, { series: 1, min: 8, max: 12, repos: 60 });
          app.etat.active = {
            id: 'qa-session', jourId: 'qa', nom: 'Séance QA', debut: Date.now(), fin: 0,
            note: '', echauffement: true, index: 0,
            exercices: [{ exId, prevu: item, ressenti: null, douleur: false,
              series: [{ kg: 20, reps: 10, fait: false }] }]
          };
          app.etat.repos = { fin: Date.now() + 60000, total: 60, libelle: 'Repos QA', signale: false };
          app.sauver();
          app.aller('#/seance');
        });
        await page.waitForURL('**/#/seance');
        await page.locator('.forge-set-details').waitFor();
        await page.locator('.forge-meta-field select').selectOption('echauffement');
        await page.locator('.forge-meta-grid input').nth(0).fill('9.5');
        await page.locator('.forge-meta-grid input').nth(0).press('Tab');
        await page.locator('.forge-meta-grid input').nth(1).fill('1');
        await page.locator('.forge-meta-grid input').nth(1).press('Tab');
        await page.locator('.forge-set-details textarea').fill('Tempo contrôlé, bonne amplitude.');
        await page.locator('.forge-set-details textarea').press('Tab');
        await page.evaluate(() => window.FM.app.sauver());
        await page.screenshot({ path: `/tmp/forge-seance-${viewport.name}-session-details.png`, fullPage: true });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('.forge-set-details').waitFor();
        const metadata = await page.evaluate(() => {
          const entry = window.FM.app.etat.active.exercices[0];
          return { type: entry.series[0].type, rpe: entry.series[0].rpe, rir: entry.series[0].rir, note: entry.note };
        });
        if (metadata.type !== 'echauffement' || metadata.rpe !== 9.5 || metadata.rir !== 1 || metadata.note !== 'Tempo contrôlé, bonne amplitude.') {
          throw new Error('Les métadonnées RPE/RIR/type/note ne survivent pas au rechargement : ' + JSON.stringify(metadata));
        }
        const warmupVolume = await page.evaluate(() => window.FM.stats([{ kg: 20, reps: 10, fait: true, type: 'echauffement' }]).volume);
        if (warmupVolume !== 0) throw new Error('Les séries d’échauffement sont comptées dans le volume de travail.');

        /* Distance et temps sous tension sont des champs réels, persistés avec la série. */
        await page.locator('.forge-meta-field select').selectOption('distance');
        await page.locator('.forge-set-details input[type=number]').nth(2).fill('1250');
        await page.locator('.forge-set-details input[type=number]').nth(2).press('Tab');
        await page.evaluate(() => window.FM.app.sauver());
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('.forge-set-details').waitFor();
        let distance = await page.evaluate(() => window.FM.app.etat.active.exercices[0].series[0].distance);
        if (distance !== 1250) throw new Error('La distance n’est pas conservée après rechargement.');

        await page.locator('.forge-meta-field select').selectOption('tension');
        await page.locator('.forge-set-details input[type=number]').nth(2).fill('35');
        await page.locator('.forge-set-details input[type=number]').nth(2).press('Tab');
        await page.evaluate(() => window.FM.app.sauver());
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('.forge-set-details').waitFor();
        const duration = await page.evaluate(() => window.FM.app.etat.active.exercices[0].series[0].duration);
        if (duration !== 35) throw new Error('Le temps sous tension n’est pas conservé après rechargement.');

        /* Les métadonnées restent visibles dans l'historique après la fin de séance. */
        await page.evaluate(() => {
          const app = window.FM.app;
          const exId = app.etat.active.exercices[0].exId;
          app.etat.seances.push({
            id: 'qa-history', nom: 'Historique QA', debut: Date.now() - 3600000, fin: Date.now() - 1800000,
            note: 'Bilan de test',
            exercices: [{ exId, ressenti: 'correct', douleur: false, note: 'Note historique QA',
              series: [{ kg: 20, reps: 10, fait: true, type: 'echauffement', rpe: 9.5, rir: 1 }] }]
          });
          app.sauver();
          app.aller('#/detail/qa-history');
        });
        await page.waitForURL('**/#/detail/qa-history');
        await page.locator('.forge-set-summary').waitFor();
        const detailText = await page.locator('body').innerText();
        if (!detailText.includes('RPE 9.5') || !detailText.includes('RIR 1') || !detailText.includes('Note historique QA')) {
          throw new Error('Les métadonnées de série ne sont pas visibles dans le détail historique.');
        }

        /* Pause et reprise du minuteur, y compris après un rechargement. */
        const pauseButton = page.locator('[data-forge-pause]');
        await pauseButton.waitFor();
        await pauseButton.click();
        if (!(await page.evaluate(() => window.FM.app.etat.repos.paused))) throw new Error('Le minuteur ne passe pas en pause.');
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('[data-forge-pause]').waitFor();
        if ((await page.locator('[data-forge-pause]').innerText()) !== 'Reprendre') throw new Error('La pause du minuteur n’est pas conservée après rechargement.');
        await page.locator('[data-forge-pause]').click();
        if (await page.evaluate(() => !!window.FM.app.etat.repos.paused)) throw new Error('Le minuteur ne reprend pas correctement.');

        /* Vérifie l'accès à la reprise et le flush de sauvegarde avant fermeture. */
        await page.evaluate(() => window.FM.app.aller('#/programme'));
        await page.locator('.forge-resume-banner').waitFor();
        await page.evaluate(() => {
          window.__forgeSaveCalls = 0;
          window.FM.store.sauver = () => { window.__forgeSaveCalls += 1; };
          window.dispatchEvent(new Event('pagehide'));
        });
        const saveCalls = await page.evaluate(() => window.__forgeSaveCalls);
        if (saveCalls < 1) throw new Error('La sauvegarde de sécurité pagehide ne s’est pas déclenchée.');
        if (!(await page.locator('.forge-resume-banner').innerText()).includes('Séance QA')) {
          throw new Error('Le rappel de reprise ne montre pas la séance active.');
        }

        /* Le profil et le mode local restent accessibles hors ligne, même avec le cloud configuré. */
        await page.context().setOffline(true);
        await page.evaluate(() => window.FM.app.aller('#/profil'));
        await page.locator('.forge-cloud-card').waitFor();
        const cloudStatus = await page.locator('.forge-cloud-status').innerText();
        if (!cloudStatus.includes('Hors ligne')) throw new Error('Le mode hors ligne ne préserve pas l’accès au profil cloud/local : ' + cloudStatus);
      } catch (error) {
        const body = await page.locator('body').innerText().catch(() => '[body inaccessible]');
        const html = await page.locator('html').evaluate(el => el.outerHTML).catch(() => '[html inaccessible]');
        const diagnostic = `DIAGNOSTIC ${viewport.name}: ${error.message}\nURL: ${page.url()}\nBODY:\n${body}\nPAGE ERRORS:\n${failures.join('\n')}\nHTML:\n${html.slice(0, 18000)}`;
        console.error(diagnostic);
        require('node:fs').writeFileSync(`/tmp/forge-seance-${viewport.name}-diagnostics.txt`, diagnostic);
        await page.screenshot({ path: `/tmp/forge-seance-${viewport.name}-failure.png`, fullPage: true }).catch(() => {});
        throw error;
      } finally {
        await page.close();
      }
    }
    if (failures.length) throw new Error(failures.join('\n'));
    console.log('Forge Muscu Séance smoke tests: OK (mobile + desktop, Programme/Exercices/Suivi, ouverture fiche et retour).');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error('SMOKE TEST FAILURE:', error.stack || error); process.exit(1); });
