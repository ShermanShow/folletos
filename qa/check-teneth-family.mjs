import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(pathToFileURL('C:/Users/emart/AppData/Local/Temp/huenu-playwright-core/node_modules/playwright-core/index.mjs').href);
const root = path.resolve('src');
const slugs = ['teneth-fc7090a','teneth-fc5070e','teneth-fc9012','teneth-fc1313u','teneth-tn24ccd','teneth-tn48ccd','teneth-tn59ccd','teneth-l6hkpro'];
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg'};
const server = http.createServer(async (req,res) => {
  const name = decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.resolve(root,name);
  if (!file.startsWith(root + path.sep)) {res.writeHead(403);res.end();return}
  try {const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
  catch {res.writeHead(404);res.end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/emart/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'});
try {
  const page=await browser.newPage({viewport:{width:794,height:1123},deviceScaleFactor:1});
  const base=`http://127.0.0.1:${server.address().port}`;
  await fs.mkdir('tmp/teneth-family',{recursive:true});
  for (const slug of slugs) {
    for (const n of [1,2]) {
      await page.goto(`${base}/${slug}-p${n}.html?print=1`,{waitUntil:'networkidle'});
      await page.evaluate(()=>document.fonts.ready);
      const check=await page.evaluate(()=>{
        const sheet=document.querySelector('.page');
        const ids=[...sheet.querySelectorAll('[data-eid]')].map(x=>x.dataset.eid);
        return {width:sheet.clientWidth,height:sheet.clientHeight,scrollHeight:sheet.scrollHeight,
          duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),
          brokenImages:[...sheet.querySelectorAll('img')].filter(x=>!x.complete||!x.naturalWidth).map(x=>x.src),
          model:document.body.dataset.model};
      });
      if (check.scrollHeight>check.height+1||check.brokenImages.length||check.duplicateIds.length||check.model!==slug)
        throw new Error(`${slug} page ${n}: ${JSON.stringify(check)}`);
      await page.screenshot({path:`tmp/teneth-family/${slug}-p${n}.png`});
    }
    await page.goto(`${base}/${slug}.html`,{waitUntil:'networkidle'});
    if (await page.locator('.page-card').count()!==2) throw new Error(`${slug} preview cards`);
    await page.goto(`${base}/${slug}-print.html?pages=2`,{waitUntil:'networkidle'});
    if (await page.locator('iframe').count()!==1) throw new Error(`${slug} print selection`);
    console.log(`${slug}: 2 A4 sheets, images, preview and PDF selection OK`);
  }
  await page.goto(`${base}/teneth-fc7090a-p1.html`,{waitUntil:'networkidle'});
  await page.locator('#edit-toggle').click();
  const title=page.locator('[data-eid="hero-subtitle"]');
  await title.dblclick();
  await title.fill('Mesa de corte de prueba');
  await page.locator('#edit-toggle').click();
  const machine=page.locator('[data-eid="machine"]');
  await page.locator('#edit-toggle').click();
  const box=await machine.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+12,box.y+box.height/2+8);
  await page.mouse.up();
  const position=await machine.evaluate(el=>({left:el.style.left,top:el.style.top,transform:el.style.transform}));
  if (!position.left && !position.transform) throw new Error('Machine drag did not move');
  await page.locator('#save').click();
  await page.reload({waitUntil:'networkidle'});
  if (await title.textContent()!=='Mesa de corte de prueba' || JSON.stringify(await machine.evaluate(el=>({left:el.style.left,top:el.style.top,transform:el.style.transform})))!==JSON.stringify(position))
    throw new Error('Text or position was not restored from saved state');
  console.log('Editor text, machine movement and saved layout OK');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve))}
