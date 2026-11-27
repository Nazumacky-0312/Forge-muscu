const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(process.env.FORGE_SITE || 'public');
const port = 4177;

(async () => {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1:' + port).pathname);
    const file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
    fs.readFile(target, (err, data) => {
      if (err) { res.writeHead(404).end('Not found'); return; }
      const ext = path.extname(target);
      const mime = ext === '.html' ? 'text/html; charset=utf-8' : ext === '.js' ? 'text/javascript; charset=utf-8' : ext === '.css' ? 'text/css; charset=utf-8' : ext === '.json' ? 'application/json' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime }); res.end(data);
    });
  });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1365, height: 900 }]) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      page.setDefaultTimeout(15000);
      page.on('pageerror', error => errors.push(viewport.name + ': ' + error.message));
      await page.route('https://world.openfoodfacts.org/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            products: [{
              product_name: 'Forge Protein Bar',
              brands: 'Forge QA',
              nutriments: {
                'energy-kcal_100g': 350,
                proteins_100g: 20,
                carbohydrates_100g: 40,
                fat_100g: 10
              }
            }]
          })
        });
      });
      await page.goto('http://127.0.0.1:' + port + '/#/pro/aliments', { waitUntil: 'domcontentloaded' });
      await page.locator('input[type="search"]').waitFor();
      await page.locator('input[type="search"]').fill('protein bar');
      await page.getByRole('button', { name: 'Rechercher' }).click();
      await page.getByRole('heading', { name: 'Forge Protein Bar' }).waitFor();
      const toggle = page.locator('.forge-nutrition-favorite-toggle');
      await toggle.waitFor();
      await toggle.click();
      const favorite = page.locator('.forge-nutrition-favorite-item');
      await favorite.waitFor();
      const favoriteText = await favorite.textContent();
      if (!favoriteText.includes('Forge Protein Bar') || !favoriteText.includes('350 kcal')) {
        throw new Error('Les informations du favori sont incomplètes sur ' + viewport.name + ' : ' + favoriteText);
      }
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('forge-nutrition-favorites-v1') || '[]'));
      if (saved.length !== 1 || saved[0].name !== 'Forge Protein Bar') {
        throw new Error('Le favori ne persiste pas localement sur ' + viewport.name + ' : ' + JSON.stringify(saved));
      }
      await favorite.getByRole('button', { name: 'Ajouter 100 g' }).click();
      await page.waitForURL('**/#/nutrition');
      const meal = await page.evaluate(() => window.FM.app.etat.nutrition[window.FM.app.etat.nutrition.length - 1]);
      if (!meal || !meal.repas.includes('Forge Protein Bar') || meal.kcal !== 350 || meal.proteines !== 20) {
        throw new Error('Le favori n’est pas ajouté au journal nutritionnel sur ' + viewport.name + ' : ' + JSON.stringify(meal));
      }
      await page.goto('http://127.0.0.1:' + port + '/#/pro/aliments', { waitUntil: 'domcontentloaded' });
      await page.locator('.forge-nutrition-favorites').waitFor();
      if (!(await page.locator('.forge-nutrition-favorite-item').textContent()).includes('Forge Protein Bar')) {
        throw new Error('Le favori a disparu après navigation sur ' + viewport.name);
      }
      await page.locator('.forge-nutrition-favorite-item').getByRole('button', { name: 'Retirer' }).click();
      if (!(await page.locator('.forge-nutrition-favorites').textContent()).includes('Enregistre un aliment')) {
        throw new Error('La suppression du favori ne fonctionne pas sur ' + viewport.name);
      }
      await page.close();
    }
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Nutrition favorites smoke test passed on mobile and desktop.');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
