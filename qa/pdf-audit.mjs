import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const packagePath = path.join(os.tmpdir(), 'hr3002dt-pdf-check', 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs');
const pdf = await import(pathToFileURL(packagePath).href);
const canvasPackage = path.join(os.tmpdir(), 'hr3002dt-pdf-check', 'node_modules', '@napi-rs', 'canvas', 'index.js');
const { createCanvas } = await import(pathToFileURL(canvasPackage).href);
const dir = 'C:/Users/emart/Downloads';
for (const name of fs.readdirSync(dir).filter(name => /huenu-hr-600[247]-dt-brochure/i.test(name) && name.endsWith('.pdf'))) {
  const doc = await pdf.getDocument({ data: new Uint8Array(fs.readFileSync(path.join(dir, name))) }).promise;
  console.log('\nFILE', name, 'PAGES', doc.numPages);
  for (let index = 1; index <= doc.numPages; index++) {
    const page = await doc.getPage(index);
    const content = await page.getTextContent();
    const operatorList = await page.getOperatorList();
    console.log('\nPAGE', index, 'SIZE', page.view[2], page.view[3], 'OPERATORS', operatorList.fnArray.length);
    console.log(content.items.map(item => item.str).join(' ').slice(0, 10000));
    const viewport = page.getViewport({scale:1.5});
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
    const output = path.join('C:/Users/emart/Documents/Codex/2026-09-14/https-claude-ai-share-0f5bcb71-c2e0/work/vercel-latest/qa', name.replace('.pdf', `-p${index}.png`));
    fs.writeFileSync(output, canvas.toBuffer('image/png'));
  }
}
