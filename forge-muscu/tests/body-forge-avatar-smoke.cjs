const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(process.env.FORGE_SITE || 'public');
const port = 4174;

(async () => {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${port}`).pathname);
    const file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
    fs.readFile(target, (err, data) => {
      if (err) { res.writeHead(404).end('Not found'); return; }
      const ext = path.extname(target);
      const mime = ext === '.html' ? 'text/html; charset=utf-8' : ext === '.js' ? 'text/javascript; charset=utf-8' : ext === '.css' ? 'text/css; charset=utf-8' : ext === '.json' ? 'application/json; charset=utf-8' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime }); res.end(data);
    });
  });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.addInitScript(() => localStorage.setItem('forge-body-rank-settings-v1', JSON.stringify({ weight: 70, sex: 'm' })));
    await page.goto(`http://127.0.0.1:${port}/#/classement/body`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Body Forge' }).waitFor();
    await page.locator('.forge-avatar-3d-canvas canvas').waitFor();
    await page.waitForFunction(() => document.querySelector('.forge-avatar-3d-canvas')?.dataset.avatarLoaded === 'true', null, { timeout: 90000 });
    const male = await page.locator('.forge-avatar-3d-canvas').evaluate(el => ({
      sex: el.dataset.avatarSex, meshes: Number(el.dataset.muscleMeshes),
      width: el.querySelector('canvas')?.clientWidth, height: el.querySelector('canvas')?.clientHeight
    }));
    if (male.sex !== 'male' || male.meshes < 15 || male.width < 200 || male.height < 300) {
      throw new Error('Modèle masculin incomplet ou non visible : ' + JSON.stringify(male));
    }
    await page.screenshot({ path: '/tmp/forge-body-avatar-mobile.png', fullPage: true });
    await page.getByRole('button', { name: 'Femme' }).click();
    await page.waitForFunction(() => document.querySelector('.forge-avatar-3d-canvas')?.dataset.avatarSex === 'female' && document.querySelector('.forge-avatar-3d-canvas')?.dataset.avatarLoaded === 'true', null, { timeout: 90000 });
    const female = await page.locator('.forge-avatar-3d-canvas').evaluate(el => ({ sex: el.dataset.avatarSex, meshes: Number(el.dataset.muscleMeshes) }));
    if (female.sex !== 'female' || female.meshes < 15) throw new Error('Modèle féminin incomplet : ' + JSON.stringify(female));
    await page.getByRole('button', { name: 'Dos' }).click();
    await page.setViewportSize({ width: 1365, height: 900 });
    const desktop = await page.locator('.forge-avatar-3d-canvas canvas').evaluate(el => ({ width: el.clientWidth, height: el.clientHeight }));
    if (desktop.width < 400 || desktop.height < 300) throw new Error('Le rendu 3D ne s’adapte pas au format ordinateur : ' + JSON.stringify(desktop));
    if (!(await page.locator('.forge-avatar-credit').innerText()).includes('CC BY 4.0')) throw new Error('Le crédit du modèle CC BY 4.0 est absent.');
    if (errors.length) throw new Error('Erreurs JavaScript : ' + errors.join(' | '));
    await page.screenshot({ path: '/tmp/forge-body-avatar-desktop.png', fullPage: true });
    console.log('Body Forge avatar OK:', JSON.stringify({ male, female, desktop }));
  } finally {
    await browser.close();
    server.close();
  }
})();
