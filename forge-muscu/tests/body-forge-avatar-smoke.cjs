const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(process.env.FORGE_SITE || 'public');
const port = 4174;

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
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.addInitScript(() => localStorage.setItem('forge-body-rank-settings-v1', JSON.stringify({ weight: 70, sex: 'm' })));
    await page.goto('http://127.0.0.1:' + port + '/#/classement/body', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Body Forge' }).waitFor();
    await page.locator('.forge-bodygraph-figure').nth(1).waitFor();
    const mobile = await page.locator('.forge-bodygraph-figure').evaluateAll(nodes => ({
      count: nodes.length,
      labels: nodes.map(el => el.getAttribute('aria-label')),
      widths: nodes.map(el => Math.round(el.getBoundingClientRect().width)),
      heights: nodes.map(el => Math.round(el.getBoundingClientRect().height)),
      coloredMuscles: nodes.map(el => el.querySelectorAll('.bf-muscles path,.bf-muscles ellipse').length)
    }));
    if (mobile.count !== 2 || !mobile.labels[0].includes('masculin') || !mobile.labels[1].includes('masculin') ||
        mobile.widths.some(x => x < 90) || mobile.heights.some(x => x < 160) || mobile.coloredMuscles.some(x => x < 6)) {
      throw new Error('Bodygraph masculin incomplet ou non visible sur mobile : ' + JSON.stringify(mobile));
    }
    await page.getByRole('button', { name: 'Femme' }).click();
    const female = await page.locator('.forge-bodygraph-figure').evaluateAll(nodes => nodes.map(el => el.getAttribute('aria-label')));
    if (female.length !== 2 || female.some(x => !x.includes('féminin'))) throw new Error('Le sélecteur Femme ne met pas à jour les deux silhouettes : ' + JSON.stringify(female));
    await page.setViewportSize({ width: 1365, height: 900 });
    const desktop = await page.locator('.forge-bodygraph-figure').evaluateAll(nodes => nodes.map(el => ({ width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) })));
    if (desktop.length !== 2 || desktop.some(x => x.width < 150 || x.height < 220)) throw new Error('Le bodygraph ne s’adapte pas au format ordinateur : ' + JSON.stringify(desktop));
    if (await page.locator('.forge-avatar-3d-canvas').count()) throw new Error('L’ancien avatar 3D est encore affiché.');
    if (errors.length) throw new Error('Erreurs JavaScript : ' + errors.join(' | '));
    console.log('Body Forge bodygraph OK:', JSON.stringify({ mobile, female, desktop }));
  } finally {
    await browser.close();
    server.close();
  }
})();
