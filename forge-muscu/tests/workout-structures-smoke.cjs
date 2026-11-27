const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(process.env.FORGE_SITE || 'public');
const port = 4177;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };

(async () => {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${port}`).pathname);
    const file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
    fs.readFile(target, (error, data) => {
      if (error) { res.writeHead(404).end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream' }).end(data);
    });
  });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const failures = [];
  try {
    for (const viewport of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1365, height: 900 }]) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      page.setDefaultTimeout(10000);
      page.on('pageerror', error => failures.push(`${viewport.name}: ${error.message}`));
      await page.goto(`http://127.0.0.1:${port}/#/seance`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        const app = window.FM.app;
        const active = window.FM.nouvelleSeance(app.etat, app.etat.programme.jours[0]);
        active.echauffement = true;
        active.exercices = active.exercices.slice(0, 3);
        active.exercices.forEach(entry => { entry.series = [{ kg: 40, reps: 8, fait: false }, { kg: 40, reps: 8, fait: false }]; });
        app.etat.active = active;
        app.sauver();
        app.aller('#/seance');
      });

      await page.getByRole('button', { name: 'Créer' }).click();
      await page.locator('.forge-structure-options input').nth(1).check();
      await page.getByRole('button', { name: 'Créer un superset' }).click();
      await page.waitForFunction(() => {
        const items = window.FM.app.etat.active.exercices;
        return items.filter(entry => entry.structureType === 'superset').length === 2;
      });
      let state = await page.evaluate(() => {
        const active = window.FM.app.etat.active;
        return { index: active.index, members: active.exercices.map((entry, index) => ({ index, id: entry.structureId, type: entry.structureType })) };
      });
      const paired = state.members.filter(entry => entry.type === 'superset');
      if (paired.length !== 2 || paired[1].index !== paired[0].index + 1) throw new Error('Les exercices du superset doivent être côte à côte.');

      await page.getByRole('button', { name: 'Valider la série' }).click();
      await page.waitForFunction(() => window.FM.app.etat.active.index === 1);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.FM.app.etat.active.exercices.filter(entry => entry.structureType === 'superset').length === 2);

      await page.getByRole('button', { name: 'Modifier' }).click();
      const dialog = page.locator('dialog');
      await dialog.locator('.forge-structure-options input').nth(2).check();
      await dialog.getByRole('button', { name: 'Créer un circuit' }).click();
      await page.waitForFunction(() => window.FM.app.etat.active.exercices.filter(entry => entry.structureType === 'circuit').length === 3);
      await page.getByRole('button', { name: 'Valider la série' }).click();
      await page.waitForFunction(() => window.FM.app.etat.active.index === 2);
      await page.getByRole('button', { name: 'Valider la série' }).click();
      await page.waitForFunction(() => window.FM.app.etat.active.index === 0);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.FM.app.etat.active.exercices.filter(entry => entry.structureType === 'circuit').length === 3);

      await page.evaluate(() => window.FM.app.aller('#/programme'));
      await page.getByRole('button', { name: 'Modifier' }).first().click();
      const exerciseBlocks = page.locator('.forge-seance-panel .carte .bloc[draggable="true"]');
      await exerciseBlocks.nth(1).waitFor();
      const before = await page.evaluate(() => window.FM.app.etat.programme.jours[0].items.map(item => item.exId));
      const boxes = await page.evaluate(({ height }) => {
        document.documentElement.style.scrollBehavior = 'auto';
        const source = document.querySelectorAll('.forge-drag-handle')[2].getBoundingClientRect();
        const target = document.querySelectorAll('.forge-drag-handle')[3].getBoundingClientRect();
        const sourceDocumentY = source.top + window.scrollY;
        const targetDocumentY = target.top + window.scrollY;
        window.scrollTo(0, Math.max(0, (sourceDocumentY + targetDocumentY) / 2 - height / 2));
        return true;
      }, { height: viewport.height });
      await page.waitForTimeout(50);
      const source = await page.locator('.forge-drag-handle').nth(2).boundingBox();
      const target = await page.locator('.forge-drag-handle').nth(3).boundingBox();
      if (source.y < 0 || target.y + target.height > viewport.height) throw new Error('Les deux poignées doivent être visibles pour le contrôle du glisser-déposer : ' + JSON.stringify({ source, target, viewport }));
      await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
      await page.mouse.down();
      await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 4 });
      await page.mouse.up();
      await page.waitForTimeout(150);
      const after = await page.evaluate(() => window.FM.app.etat.programme.jours[0].items.map(item => item.exId));
      if (after[2] !== before[3] || after[3] !== before[2]) throw new Error('Le glisser-déposer ne réorganise pas le programme : ' + JSON.stringify({ before, after, source, target, count: await exerciseBlocks.count() }));
      await page.getByRole('button', { name: 'Dupliquer cette séance' }).first().click();
      await page.waitForFunction(() => window.FM.app.etat.programme.jours.length === 4);
      await page.reload({ waitUntil: 'domcontentloaded' });
      const persisted = await page.evaluate(() => ({ days: window.FM.app.etat.programme.jours.length, first: window.FM.app.etat.programme.jours[0].items.map(item => item.exId) }));
      if (persisted.days !== 4 || persisted.first[2] !== before[3]) throw new Error('La réorganisation ou la duplication n’est pas conservée après rechargement.');
      await page.close();
    }
    if (failures.length) throw new Error(failures.join('\n'));
    console.log('Workout structures passed: superset/circuit alternation, reload persistence, program drag-and-drop and duplication (mobile + desktop).');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
