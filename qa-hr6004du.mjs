import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/emart/AppData/Local/Temp/hr6004du-qa/node_modules/playwright-core');
const baseUrl = process.env.HR6004DU_QA_BASE || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1100, height: 1250 } });
try {
  for (const n of [1, 2, 3]) {
    await page.goto(baseUrl + '/hr6004du-p' + n + '.html');
    await page.locator('#edit-toggle').waitFor();
    await page.locator('#edit-toggle').click();
    if (!await page.locator('body').evaluate(el => el.classList.contains('editing'))) throw Error('Edición no activada en hoja ' + n);
    console.log('Hoja ' + n + ': controles y edición activos');
  }
  await page.goto(baseUrl + '/hr6004du-p1.html');
  await page.locator('#edit-toggle').click();
  await page.locator('[data-eid="subtitle"]').dblclick();
  if (await page.locator('[data-eid="subtitle"]').getAttribute('contenteditable') !== 'true') throw Error('Doble clic en texto no funciona');
  await page.locator('[data-eid="subtitle"]').fill('Prueba de edición HR6004DU');
  await page.locator('[data-eid="badge"]').click();
  const printer = page.locator('[data-eid="printer"]');
  const before = await printer.boundingBox();
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 + 25, before.y + before.height / 2 + 15, { steps: 5 });
  await page.mouse.up();
  const after = await printer.boundingBox();
  if (after.x <= before.x + 10 || after.y <= before.y + 5 || after.width < 20) throw Error('Arrastre de foto falló o desapareció');
  await printer.click();
  const widthBefore = await printer.evaluate(el => el.getBoundingClientRect().width);
  const handle = await page.locator('.edit-handle.orange').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 30, handle.y + handle.height / 2, { steps: 5 });
  await page.mouse.up();
  const widthAfter = await printer.evaluate(el => el.getBoundingClientRect().width);
  if (widthAfter <= widthBefore) throw Error('Cambio de tamaño de foto falló');
  const chooser = page.waitForEvent('filechooser');
  await page.locator('[data-eid="icon-1"]').dblclick();
  await chooser;
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-html').click();
  const download = await downloadPromise;
  const exported = readFileSync(await download.path(), 'utf8');
  if (download.suggestedFilename() !== 'HR6004DU_hoja1.html' || !exported.includes('Prueba de edición HR6004DU') || exported.includes('id="edit-toggle"')) throw Error('HTML descargado incorrecto');
  console.log('Texto, arrastre, tamaño, doble clic en ícono y descarga HTML: OK');
} finally {
  await browser.close();
}
