import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/emart/AppData/Local/Temp/hr6004du-qa/node_modules/playwright-core');
const base = 'https://folletos-huenu.vercel.app';
const stored = await (await fetch(base + '/api/state?key=huenu_editor_state_hr6004du_v1_p2')).json();
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
try {
  await page.goto(base + '/hr6004du-p2.html');
  await page.waitForFunction(src => document.querySelector('[data-eid="card2-image"]')?.getAttribute('src') === src, stored.state['card2-image'].src, { timeout: 20000 });
  const direct = await page.locator('[data-eid="machine"]').evaluate(el => ({ left: el.style.left, top: el.style.top, src: el.getAttribute('src').startsWith('/api/image?path=') }));
  console.log('Hoja directa:', JSON.stringify(direct));
  await page.goto(base + '/hr6004du.html');
  const frame = page.frameLocator('iframe[src*="hr6004du-p2"]');
  await frame.locator('[data-eid="card2-image"]').waitFor();
  await page.waitForFunction(src => {
    const iframe = document.querySelector('iframe[src*="hr6004du-p2"]');
    return iframe?.contentDocument?.querySelector('[data-eid="card2-image"]')?.getAttribute('src') === src;
  }, stored.state['card2-image'].src, { timeout: 20000 });
  const preview = await frame.locator('[data-eid="machine"]').evaluate(el => ({ left: el.style.left, top: el.style.top, src: el.getAttribute('src').startsWith('/api/image?path=') }));
  console.log('Vista previa:', JSON.stringify(preview));
} finally {
  await browser.close();
}
