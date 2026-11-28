const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(process.env.FORGE_SITE || 'public');
const port = 4187;

(async () => {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1:' + port).pathname);
    const file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
    fs.readFile(target, (err, data) => {
      if (err) { res.writeHead(404).end('Not found'); return; }
      const ext = path.extname(target);
      const mime = ext === '.html' ? 'text/html; charset=utf-8' : ext === '.js' ? 'text/javascript; charset=utf-8' : ext === '.css' ? 'text/css; charset=utf-8' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime }); res.end(data);
    });
  });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1365, height: 900 }]) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, serviceWorkers: 'block' });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      page.on('pageerror', error => errors.push(viewport.name + ': ' + error.message));
      await page.goto('http://127.0.0.1:' + port + '/#/exercices', { waitUntil: 'domcontentloaded' });
      await page.locator('.forge-library-row').first().waitFor();

      const baseline = await page.locator('.forge-library-row').count();
      if (baseline < 20) throw new Error('La bibliothèque semble incomplète sur ' + viewport.name + ' : ' + baseline);
      await page.getByRole('searchbox', { name: 'Rechercher un exercice, muscle ou matériel' }).fill('developpe couche');
      if ((await page.locator('.forge-library-row').count()) < 1) throw new Error('La recherche sans accents ne trouve pas le développé couché sur ' + viewport.name);
      await page.getByRole('searchbox').fill('');

      const muscle = page.getByRole('combobox', { name: 'Filtrer par groupe musculaire' });
      await muscle.selectOption('pectoraux');
      const muscleValid = await page.locator('.forge-library-row a.exercise-main').evaluateAll(links => links.every(link => {
        const id = link.getAttribute('href').split('/').pop(), ex = window.FM.EX[id];
        return ex.muscles.includes('pectoraux') || ex.secondaires.includes('pectoraux');
      }));
      if (!muscleValid) throw new Error('Le filtre doit inclure les muscles secondaires et exclure les autres sur ' + viewport.name);

      await muscle.selectOption('');
      await page.getByRole('combobox', { name: 'Filtrer par matériel' }).selectOption('halteres');
      const gearValid = await page.locator('.forge-library-row a.exercise-main').evaluateAll(links => links.every(link => {
        const ex = window.FM.EX[link.getAttribute('href').split('/').pop()];
        return ex.equip.some(group => group.includes('halteres'));
      }));
      if (!gearValid) throw new Error('Le filtre matériel laisse passer un exercice sans haltères sur ' + viewport.name);
      await page.getByRole('combobox', { name: 'Filtrer par matériel' }).selectOption('');
      await page.getByRole('combobox', { name: 'Filtrer par niveau' }).selectOption('2');
      const levelValid = await page.locator('.forge-library-row a.exercise-main').evaluateAll(links => links.every(link => window.FM.EX[link.getAttribute('href').split('/').pop()].niveau === 2));
      if (!levelValid) throw new Error('Le filtre de niveau est incorrect sur ' + viewport.name);
      await page.getByRole('combobox', { name: 'Filtrer par niveau' }).selectOption('');

      const ids = await page.evaluate(() => window.FM.EXERCICES.slice(0, 2).map(ex => ex.id));
      await page.evaluate(ids => {
        const now = Date.now();
        window.FM.app.etat.seances = [
          { debut: now - 4 * 864e5, exercices: [{ exId: ids[1], series: [{ fait: true, reps: 8, type: 'travail' }] }] },
          { debut: now - 2 * 864e5, exercices: [{ exId: ids[1], series: [{ fait: true, reps: 8, type: 'travail' }] }] },
          { debut: now, exercices: [{ exId: ids[0], series: [{ fait: true, reps: 8, type: 'travail' }] }] }
        ];
        window.FM.app.aller('#/exercices');
      }, ids);
      await page.getByRole('combobox', { name: 'Trier les exercices' }).selectOption('often');
      const oftenFirst = await page.locator('.forge-library-row a.exercise-main').first().getAttribute('href');
      if (!oftenFirst.endsWith('/' + ids[1])) throw new Error('Le tri par fréquence ne place pas l’exercice le plus entraîné en premier sur ' + viewport.name);
      await page.getByRole('combobox', { name: 'Trier les exercices' }).selectOption('recent');
      const recentFirst = await page.locator('.forge-library-row a.exercise-main').first().getAttribute('href');
      if (!recentFirst.endsWith('/' + ids[0])) throw new Error('Le tri récent ne place pas le dernier exercice réalisé en premier sur ' + viewport.name);
      await page.getByRole('combobox', { name: 'Trier les exercices' }).selectOption('name');

      const star = page.locator('.forge-library-row').first().getByRole('button', { name: /^Ajouter aux favoris/ });
      const favoriteId = (await page.locator('.forge-library-row a.exercise-main').first().getAttribute('href')).split('/').pop();
      await star.click();
      if (await page.evaluate(() => document.activeElement.dataset.exerciseId) !== favoriteId) throw new Error('Le focus clavier est perdu après l’ajout d’un favori sur ' + viewport.name);
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('forge-exercise-favorites-v1') || '[]'));
      if (!saved.includes(favoriteId)) throw new Error('Le favori ne persiste pas sur cet appareil sur ' + viewport.name);
      await page.getByRole('button', { name: /Mes favoris/ }).click();
      const shown = await page.locator('.forge-library-row a.exercise-main').evaluateAll(links => links.map(link => link.getAttribute('href').split('/').pop()));
      if (shown.length !== 1 || shown[0] !== favoriteId) throw new Error('Le filtre favoris affiche des exercices inattendus sur ' + viewport.name);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('.forge-library-row').first().waitFor();
      if (await page.getByRole('button', { name: /Mes favoris/ }).getAttribute('aria-pressed') !== 'false') throw new Error('Le filtre favoris devrait revenir à la vue complète après rechargement sur ' + viewport.name);
      const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('forge-exercise-favorites-v1') || '[]'));
      if (!persisted.includes(favoriteId)) throw new Error('Le favori a disparu après rechargement sur ' + viewport.name);

      await page.getByRole('button', { name: /Mes favoris/ }).click();
      const clearFavorite = page.locator('.forge-library-row').first().getByRole('button', { name: /^Retirer des favoris/ });
      await clearFavorite.click();
      if ((await page.locator('.forge-library-row').count()) !== 0) throw new Error('La suppression du favori ne met pas à jour la liste sur ' + viewport.name);
      const clearButton = page.getByRole('button', { name: 'Effacer les filtres' });
      await clearButton.click();
      if ((await page.locator('.forge-library-row').count()) !== baseline) throw new Error('Effacer les filtres ne restaure pas toute la bibliothèque sur ' + viewport.name);

      const box = await page.locator('.forge-library-filters').boundingBox();
      if (!box || box.width > viewport.width) throw new Error('Les filtres débordent sur ' + viewport.name);
      await context.close();
    }
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Exercise library smoke test passed on mobile and desktop.');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
