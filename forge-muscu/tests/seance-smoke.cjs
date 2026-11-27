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
    if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) {
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
      page.on('pageerror', error => failures.push(`${viewport.name}: ${error.message}`));
      await page.goto(`http://127.0.0.1:${port}/#/programme`, { waitUntil: 'domcontentloaded' });
      await page.locator('.forge-seance-heading h1').getByText('Séance').waitFor();
      await page.locator('.forge-seance-tab').nth(0).waitFor();
      if (await page.locator('#menu a').count() !== 4) throw new Error('La navigation principale ne contient pas exactement 4 rubriques.');
      if (await page.locator('.forge-seance-tab').count() !== 3) throw new Error('Les 3 onglets de Séance ne sont pas présents.');
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
      await page.close();
    }
    if (failures.length) throw new Error(failures.join('\n'));
    console.log('Forge Muscu Séance smoke tests: OK (mobile + desktop, Programme/Exercices/Suivi, ouverture fiche et retour).');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exit(1); });
