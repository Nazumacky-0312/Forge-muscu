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
    await page.locator('.forge-bodygraph-figure').nth(1).waitFor({ state: 'attached' });
    await page.evaluate(() => {
      const app = window.FM.app;
      const entry = Object.entries(window.FM.EX).find(([, ex]) => /développé couché|bench press/i.test(ex.nom));
      if (!entry) throw new Error('Aucun exercice de développé couché trouvé pour le test Body Forge.');
      const [exId] = entry;
      app.etat.seances.push({
        id: 'body-forge-avatar-qa', nom: 'Test avatar Body Forge', debut: Date.now(), fin: Date.now(),
        exercices: [{ exId, series: [{ kg: 60, reps: 8, fait: true, type: 'travail' }] }]
      });
      app.sauver();
      app.rendre();
    });
    await page.locator('.forge-body-exercise').first().waitFor();
    await page.locator('.forge-bodygraph-figure').nth(1).waitFor({ state: 'attached' });
    await page.waitForFunction(() => {
      const stage = document.querySelector('.forge-avatar-3d-stage');
      return !!stage && (stage.dataset.avatarLoaded === 'true' || !!stage.dataset.avatarError);
    }, { timeout: 12000 }).catch(() => {});
    const mobile = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('.forge-bodygraph-figure')];
      const pair = document.querySelector('.forge-bodygraph-pair');
      const stage = document.querySelector('.forge-avatar-3d-stage');
      const rect = stage?.getBoundingClientRect();
      return {
        count: nodes.length,
        labels: nodes.map(el => el.getAttribute('aria-label')),
        widths: nodes.map(el => Math.round(el.getBoundingClientRect().width)),
        heights: nodes.map(el => Math.round(el.getBoundingClientRect().height)),
        coloredMuscles: nodes.map(el => el.querySelectorAll('.bf-muscles path,.bf-muscles ellipse').length),
        coloredRankMuscles: nodes.map(el => [...el.querySelectorAll('.bf-muscles path')].filter(path => path.getAttribute('fill') !== '#8b929b').length),
        fallbackVisible: !!pair && getComputedStyle(pair).display !== 'none' && pair.clientWidth > 0,
        stageVisible: !!stage && getComputedStyle(stage).display !== 'none' && !!rect && rect.width > 0,
        stageLoaded: stage?.dataset.avatarLoaded === 'true',
        canvas: !!stage?.querySelector('canvas'),
        stageWidth: Math.round(rect?.width || 0),
        stageHeight: Math.round(rect?.height || 0)
      };
    });
    const fallbackValid = mobile.count === 2 && mobile.labels[0].includes('masculin') && mobile.labels[1].includes('masculin') &&
      mobile.coloredMuscles.every(x => x >= 6) && mobile.coloredRankMuscles[0] > 0;
    const fallbackVisible = mobile.fallbackVisible && mobile.widths.every(x => x >= 90) && mobile.heights.every(x => x >= 160);
    const modelVisible = mobile.stageVisible && mobile.stageLoaded && mobile.canvas && mobile.stageWidth >= 220 && mobile.stageHeight >= 320;
    if (!fallbackValid || (!fallbackVisible && !modelVisible)) {
      throw new Error('Body Forge doit afficher le modèle 3D chargé ou conserver un bodygraph de secours visible sur mobile : ' + JSON.stringify(mobile));
    }
    const integration = await page.evaluate(() => ({
      module: !!document.querySelector('script[type="module"][src="js/body-forge-avatar-3d.js"]'),
      attribution: !!document.querySelector('.forge-avatar-attribution')?.textContent.includes('BodyParts3D'),
      details: !!document.querySelector('.forge-avatar-muscle-details')
    }));
    if (!integration.module || !integration.attribution || !integration.details) {
      throw new Error('Le module 3D, le panneau musculaire et les crédits doivent être présents : ' + JSON.stringify(integration));
    }
    await page.getByRole('button', { name: 'Femme' }).evaluate(el => el.click());
    await page.waitForFunction(() => {
      const stage = document.querySelector('.forge-avatar-3d-stage');
      return !stage || stage.dataset.avatarSex === 'female' || !!stage.dataset.avatarError;
    }, { timeout: 12000 }).catch(() => {});
    const female = await page.locator('.forge-bodygraph-figure').evaluateAll(nodes => nodes.map(el => el.getAttribute('aria-label')));
    if (female.length !== 2 || female.some(x => !x.includes('féminin'))) throw new Error('Le sélecteur Femme ne met pas à jour les deux silhouettes : ' + JSON.stringify(female));
    await page.setViewportSize({ width: 1365, height: 900 });
    const desktop = await page.evaluate(() => {
      const pair = document.querySelector('.forge-bodygraph-pair');
      const stage = document.querySelector('.forge-avatar-3d-stage');
      const figures = [...document.querySelectorAll('.forge-bodygraph-figure')].map(el => ({ width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) }));
      const rect = stage?.getBoundingClientRect();
      const fallbackVisible = !!pair && getComputedStyle(pair).display !== 'none' && pair.clientWidth > 0;
      const stageVisible = !!stage && getComputedStyle(stage).display !== 'none' && !!rect && rect.width > 0;
      return { figures, fallbackVisible, stageVisible, stageWidth: Math.round(rect?.width || 0), stageHeight: Math.round(rect?.height || 0) };
    });
    const desktopFallback = desktop.fallbackVisible && desktop.figures.length === 2 && desktop.figures.every(x => x.width >= 150 && x.height >= 220);
    const desktop3D = desktop.stageVisible && desktop.stageWidth >= 300 && desktop.stageHeight >= 320;
    if (!desktopFallback && !desktop3D) throw new Error('Body Forge ne s’adapte pas au format ordinateur : ' + JSON.stringify(desktop));
    if (errors.length) throw new Error('Erreurs JavaScript : ' + errors.join(' | '));
    console.log('Body Forge bodygraph OK:', JSON.stringify({ mobile, female, desktop }));
  } finally {
    await browser.close();
    server.close();
  }
})();
