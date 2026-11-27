// Rendert kistenschieber.html headless zu kistenschieber.png (3840 × 2160) und eine Vorschau.
// Start: NODE_PATH=<website>/node_modules node render.cjs
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const sharp = require('sharp');

(async () => {
  const dir = __dirname;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 3840, height: 2160 } });
  page.on('console', (m) => console.log('[page]', m.text()));
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  await page.goto('file://' + path.join(dir, 'kistenschieber.html'));
  await page.waitForFunction(() => window.__done === true, null, { timeout: 120000 });
  const data = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'));
  const buf = Buffer.from(data.split(',')[1], 'base64');
  fs.writeFileSync(path.join(dir, 'kistenschieber.png'), buf);
  await browser.close();
  await sharp(buf).resize(1600).toFile(path.join(dir, 'preview.png'));
  // Mitte im Format 16:10, klein wie auf einer Karte
  await sharp(buf).extract({ left: 192, top: 0, width: 3456, height: 2160 }).resize(560).toFile(path.join(dir, 'preview-card.png'));
  console.log('ok');
})();
