import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/emart/AppData/Local/Temp/hr6004du-qa/node_modules/playwright-core');
const baseUrl = process.env.HR6004DU_QA_BASE || 'http://127.0.0.1:4173';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=', 'base64');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ acceptDownloads: true });
await page.addInitScript(() => {
  Storage.prototype.setItem = () => { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); };
});
let savedState = null;
let uploadedBytes = 0, uploadedType = '';
try {
  await page.route('**/api/state?key=*', async route => {
    if (route.request().method() === 'PUT') {
      savedState = route.request().postDataJSON().state;
      await route.fulfill({ status: 200, json: { ok: true } });
    } else await route.fulfill({ status: 200, json: { state: savedState } });
  });
  await page.route('**/api/image?*', async route => {
    if (route.request().method() === 'PUT') {
      uploadedBytes = route.request().postDataBuffer().length;
      uploadedType = route.request().headers()['content-type'];
      await route.fulfill({ status: 200, json: { url: '/api/image?path=qa' } });
    }
    else await route.fulfill({ status: 200, contentType: 'image/png', body: png });
  });
  await page.goto(baseUrl + '/hr6004du-p2.html');
  const photo = page.locator('[data-eid="card2-image"]');
  const beforeFit = await photo.evaluate(el => getComputedStyle(el).objectFit);
  if (beforeFit !== 'cover') throw Error('La foto original ya no conserva su encuadre');
  await page.locator('#edit-toggle').click();
  const chooser = page.waitForEvent('filechooser');
  await photo.dblclick();
  await (await chooser).setFiles({ name: 'prueba.png', mimeType: 'image/png', buffer: png });
  await page.waitForFunction(() => document.querySelector('#edit-status').textContent.includes('Guardado en línea'));
  if (await photo.evaluate(el => getComputedStyle(el).objectFit) !== 'contain') throw Error('La foto reemplazada sigue recortándose');
  if (savedState?.['card2-image']?.objectFit !== 'contain') throw Error('No se guardó el ajuste de proporción');
  await page.reload();
  await page.waitForFunction(() => document.querySelector('[data-eid="card2-image"]').getAttribute('src') === '/api/image?path=qa');
  if (await photo.evaluate(el => getComputedStyle(el).objectFit) !== 'contain') throw Error('El ajuste no se recuperó tras recargar');
  await page.locator('#edit-toggle').click();
  await photo.scrollIntoViewIfNeeded();
  const before = await photo.boundingBox();
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 + 24, before.y + before.height / 2 + 12, { steps: 5 });
  await page.mouse.up();
  await page.waitForFunction(() => document.querySelector('#edit-status').textContent.includes('Guardado en línea'));
  const savedLeft = savedState?.['card2-image']?.left;
  if (!savedLeft) throw Error('El movimiento no se guardó automáticamente');
  await page.reload();
  await page.waitForFunction(left => document.querySelector('[data-eid="card2-image"]')?.style.left === left, savedLeft);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-html').click();
  const exported = readFileSync(await (await downloadPromise).path(), 'utf8');
  if (!exported.includes('object-fit: contain') || !exported.includes('data:image/png;base64,')) throw Error('La descarga HTML perdió la foto o su ajuste');
  const largePng = Buffer.from(await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1400;
    const ctx = canvas.getContext('2d'), pixels = ctx.createImageData(1400, 1400);
    let seed = 1234567;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      pixels.data[i] = seed & 255;
      pixels.data[i + 1] = (seed >>> 8) & 255;
      pixels.data[i + 2] = (seed >>> 16) & 255;
      pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  }), 'base64');
  if (largePng.length <= 3800000) throw Error('La imagen de prueba no supera el límite de subida');
  await page.locator('#edit-toggle').click();
  const largeChooser = page.waitForEvent('filechooser');
  await photo.dblclick();
  await (await largeChooser).setFiles({ name: 'grande.png', mimeType: 'image/png', buffer: largePng });
  await page.waitForFunction(() => document.querySelector('#edit-status').textContent.includes('Guardado en línea'));
  if (uploadedBytes > 3800000 || uploadedType !== 'image/webp') throw Error('La imagen grande no se optimizó antes de subir');
  console.log('Imagen y posición guardadas con cuota local llena; recarga y HTML: OK');
  console.log('Imagen grande optimizada antes de subir: OK');
} finally {
  await browser.close();
}
