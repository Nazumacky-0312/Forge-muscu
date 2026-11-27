const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(process.env.FORGE_SITE || 'public');
const port = 4176;
const image = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#5f9bd2"/><circle cx="16" cy="16" r="8" fill="#ffffff"/></svg>');

(async () => {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1:' + port).pathname);
    const file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
    fs.readFile(target, (err, data) => {
      if (err) { res.writeHead(404).end('Not found'); return; }
      const ext = path.extname(target);
      const mime = ext === '.html' ? 'text/html; charset=utf-8' : ext === '.js' ? 'text/javascript; charset=utf-8' : ext === '.css' ? 'text/css; charset=utf-8' : ext === '.json' ? 'application/json' : ext === '.webp' ? 'image/webp' : 'application/octet-stream';
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
      page.on('console', message => { if (message.type() === 'error') console.log('[browser ' + viewport.name + '] ' + message.text()); });
      await page.goto('http://127.0.0.1:' + port + '/#/progression', { waitUntil: 'domcontentloaded' });
      await page.locator('.forge-progression-hub').waitFor();
      const hub = await page.evaluate(() => ({
        nav: document.querySelector('#menu a[data-vue="progression"]')?.textContent.trim(),
        cards: [...document.querySelectorAll('.forge-progression-card')].map(card => card.getAttribute('href'))
      }));
      const expectedRoutes = ['#/classement','#/suivi/progres','#/suivi/records','#/suivi/historique','#/profil','#/nutrition'];
      if (hub.nav !== 'Progression' || expectedRoutes.some(route => !hub.cards.includes(route)) || hub.cards.length !== 6) {
        throw new Error('Hub Progression incomplet sur ' + viewport.name + ' : ' + JSON.stringify(hub));
      }
      await page.goto('http://127.0.0.1:' + port + '/#/suivi/progres', { waitUntil: 'domcontentloaded' });
      await page.locator('.forge-progress-photos').waitFor();
      const controls = await page.evaluate(() => ({
        file: !!document.querySelector('.forge-progress-photo-file input[type="file"]'),
        date: !!document.querySelector('.forge-progress-photo-field input[type="date"]'),
        pose: !!document.querySelector('.forge-progress-photo-field select'),
        sync: !!document.querySelector('.forge-progress-photos-toolbar button'),
        privacy: document.querySelector('.forge-progress-photos')?.textContent.includes('restent privées')
      }));
      if (!controls.file || !controls.date || !controls.pose || !controls.sync || !controls.privacy) {
        throw new Error('Formulaire de photos incomplet sur ' + viewport.name + ' : ' + JSON.stringify(controls));
      }
      await page.locator('.forge-progress-photo-field select').selectOption('profil');
      await page.locator('.forge-progress-photo-field input[type="text"]').fill('Test de progression local');
      await page.locator('.forge-progress-photo-file input[type="file"]').setInputFiles({
        name: 'forge-progress-test.svg',
        mimeType: 'image/svg+xml',
        buffer: image
      });
      await page.locator('.forge-progress-photo-form').evaluate(form => form.requestSubmit());
      try {
        await page.waitForFunction(() => {
          const card = document.querySelector('.forge-progress-photo');
          return !!card && !!card.querySelector('img') && card.querySelector('img').src.startsWith('blob:');
        }, { timeout: 8000 });
      } catch (error) {
        const diagnostic = await page.evaluate(async () => {
          const input = document.querySelector('.forge-progress-photo-file input[type="file"]');
          let stored = null;
          try {
            stored = await new Promise((resolve, reject) => {
              const request = indexedDB.open('forge-muscu-media-v1', 1);
              request.onsuccess = () => {
                const db = request.result;
                const read = db.transaction('photos', 'readonly').objectStore('photos').getAll();
                read.onsuccess = () => { resolve(read.result.map(photo => ({ id: photo.id, date: photo.date, type: photo.blob?.type, size: photo.blob?.size }))); db.close(); };
                read.onerror = () => reject(read.error);
              };
              request.onerror = () => reject(request.error);
            });
          } catch (e) { stored = 'IndexedDB: ' + e.message; }
          return { status: document.querySelector('.forge-progress-photos-status')?.textContent, inputFiles: input?.files?.length, fileType: input?.files?.[0]?.type, stored };
        });
        console.error('Progress photo upload diagnostic (' + viewport.name + '): ' + JSON.stringify(diagnostic));
        await page.screenshot({ path: '/tmp/forge-seance-photos-failure-' + viewport.name + '.png', fullPage: true });
        throw error;
      }
      await page.waitForFunction(() => document.querySelector('.forge-progress-photos-status')?.textContent.includes('Photo enregistrée sur cet appareil.'));
      const saved = await page.evaluate(() => ({
        count: document.querySelectorAll('.forge-progress-photo').length,
        pose: document.querySelector('.forge-progress-photo-info strong')?.textContent,
        note: document.querySelector('.forge-progress-photo-info p')?.textContent
      }));
      if (saved.count !== 1 || saved.pose !== 'Profil' || saved.note !== 'Test de progression local') {
        throw new Error('La photo locale ou ses métadonnées ne sont pas conservées sur ' + viewport.name + ' : ' + JSON.stringify(saved));
      }
      await page.context().setOffline(true);
      await page.locator('.forge-progress-photos-toolbar button').evaluate(button => button.click());
      await page.waitForFunction(() => document.querySelector('.forge-progress-photos-status')?.textContent.includes('Hors ligne'));
      await page.context().setOffline(false);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('.forge-progress-photos').waitFor();
      await page.locator('.forge-progress-photo').waitFor();
      const persisted = await page.locator('.forge-progress-photo').count();
      if (persisted !== 1) throw new Error('La photo n’a pas survécu au rechargement sur ' + viewport.name + '.');
      await page.evaluate(() => { window.FM.confirmer = (title, message, label, callback) => callback(); });
      await page.locator('.forge-progress-photo-actions button.danger').evaluate(button => button.click());
      await page.waitForFunction(() => document.querySelectorAll('.forge-progress-photo').length === 0);
      await page.screenshot({ path: '/tmp/forge-seance-photos-' + viewport.name + '.png', fullPage: true });
      await page.close();
    }
    if (errors.length) throw new Error('Erreurs JavaScript : ' + errors.join(' | '));
    console.log('Progress photos: local upload, IndexedDB persistence, offline state and delete passed on mobile and desktop.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
