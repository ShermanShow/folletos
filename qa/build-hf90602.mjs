// Derive the HF90602 draft from the editable HF60902UV layout without touching its source.
import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve('src');
const from = 'hf60902uv';
const to = 'hf90602';
const files = ['', '-print', '-p1', '-p2', '-p3'];
const assetData = name => `data:image/jpeg;base64,${fs.readFileSync(path.join(src, 'assets', name)).toString('base64')}`;

function replaceOne(html, oldText, newText, context) {
  const first = html.indexOf(oldText);
  if (first < 0 || html.indexOf(oldText, first + oldText.length) >= 0) {
    throw new Error(`${context}: expected exactly one match for ${oldText.slice(0, 80)}`);
  }
  return html.slice(0, first) + newText + html.slice(first + oldText.length);
}

function setField(html, eid, value, kind = 'value') {
  const pattern = new RegExp(`(<div class="${kind} editable" data-eid="${eid}">)[^<]*(</div>)`);
  if (!pattern.test(html)) throw new Error(`Missing field ${eid}`);
  return html.replace(pattern, `$1${value}$2`);
}

for (const suffix of files) {
  const target = path.join(src, `${to}${suffix}.html`);
  if (fs.existsSync(target) && !process.argv.includes('--force')) throw new Error(`Refusing to overwrite ${target}`);
  let html = fs.readFileSync(path.join(src, `${from}${suffix}.html`), 'utf8');
  html = html.replaceAll('HF60902UV', 'HF90602').replaceAll('hf60902uv', 'hf90602');

  if (suffix === '-p1') {
    html = html.replaceAll('60 x 90 cm', '90 × 60 cm')
      .replaceAll('Epson XP600', 'Epson I3200')
      .replaceAll('20 cm', '500 mm');
    html = replaceOne(html,
      'Impresión UV directa con gran definición sobre una amplia variedad de materiales y objetos.',
      'Impresión UV directa sobre objetos y materiales rígidos.',
      'subtitle');
    html = replaceOne(html,
      '- Botellas<br>- Packaging<br>- Acrílico<br>- Vidrio<br>- Metal<br>- Madera<br>- Fundas de celular<br>- Bolígrafos<br>- Pelotas de golf<br>- Señalética<br>- Artículos promocionales',
      '- Vidrio<br>- Acrílico<br>- Madera<br>- Metal<br>- Botellas<br>- Artículos promocionales',
      'application list');
    html = replaceOne(html,
      'La <b>HUENÚ</b> <span class=hl>HF90602</span> es una impresora cama plana compacta diseñada para personalizar objetos, envases y productos rígidos. De 90 × 60 cm y su altura regulable de hasta 500 mm permiten trabajar con piezas de diferentes formatos y espesores.',
      'La <b>HUENÚ</b> <span class=hl>HF90602</span> es una impresora UV de cama plana para personalizar objetos y materiales rígidos. Su área de 900 × 600 mm y altura de hasta 500 mm permiten trabajar con piezas de diferentes formatos.',
      'intro');
    const photo = /<img class="printer-photo editable-pos img-swap" data-eid="printer-photo"[^>]*>/;
    if (!photo.test(html)) throw new Error('Missing original product photo');
    html = html.replace(photo, `<img class="printer-photo editable-pos img-swap" data-eid="printer-photo" src="${assetData('hf90602-hero.jpg')}" alt="Impresora UV plana Huenú HF90602" style="top:68mm;left:53mm;width:104mm;height:104mm;object-fit:contain;mix-blend-mode:multiply">`);
    html = replaceOne(html, '</style>', '.intro-heading{top:173mm!important}.intro-text{top:173mm!important}.apps-box,.diff-box{top:197mm!important}\n.diff-box [data-eid="diff-label-1"]{top:13mm!important;left:6mm!important;width:98mm!important;font-size:11.5px!important;line-height:1.25!important}\n.diff-box [data-eid="diff-label-2"]{top:43mm!important;left:6mm!important;width:98mm!important;font-size:11.5px!important;line-height:1.25!important}\n</style>', 'page-one-layout');
  }

  if (suffix === '-p2') {
    html = html.replaceAll('hasta 20 cm', 'hasta 500 mm')
      .replaceAll('Epson DX5 o XP600', 'Epson I3200')
      .replaceAll('Epson DX5 / XP600', 'Epson I3200');
    for (const [eid, asset] of [
      ['ph-sistema', 'hf90602-front.jpg'],
      ['ph-rodillo', 'hf90602-side.jpg'],
      ['ph-succion', 'hf90602-hero.jpg'],
    ]) {
      const pattern = new RegExp(`(<div class="ph img-swap" data-eid="${eid}"><img src=")[^"]+("[^>]*>)`);
      if (!pattern.test(html)) throw new Error(`Missing system photo ${eid}`);
      html = html.replace(pattern, `$1${assetData(asset)}$2`);
    }
    html = replaceOne(html,
      '*La configuración admite entre 2 y 3 cabezales Epson I3200, según la versión seleccionada.',
      '*Configuración con 2 o 3 cabezales Epson I3200, según la versión seleccionada.',
      'ink disclaimer');
    html = replaceOne(html, '</style>', '.tintas-card{min-height:76mm!important}.ink-groups{margin-top:2mm!important}.carcasa-bg{right:-50mm!important;width:50mm!important;height:50mm!important;bottom:2mm!important}\n</style>', 'page-two-layout');
  }

  if (suffix === '-p3') {
    html = replaceOne(html, '</style>', 'html.print-mode body{padding-top:0!important}html.print-mode .page{transform:none!important;margin-bottom:0!important}\n</style>', 'page-three-print-layout');
    const fields = {
      'v2-g1v': 'HF90602', 'v2-g2v': '900 × 600 mm',
      'v2-g3v': '2278 × 1268 × 1270 mm',
      'v2-g4v': 'Windows 7 / 8 / 10 / 11',
      'v2-g5v': 'Aproximadamente 180 kg',
      'v2-p1v': 'CMYK + blanco + barniz',
      'v2-p2v': 'Inyección de tinta UV Micro Piezo',
      'v2-p3v': '2 o 3 cabezales Epson I3200',
      'v2-p4v': '720 / 1440 / 2880 / 5760 dpi',
      'v2-p5v': 'Según configuración y modo de impresión',
      'v2-p6v': 'Unidireccional / bidireccional',
      'v2-p7v': 'Relieve y terminaciones con barniz',
      'v2-p8v': 'Hasta 500 mm',
      'v2-s1v': 'Mesa con sistema de succión',
      'v2-s2v': 'USB 3.0 / Ethernet',
      'v2-s3v': 'Software RIP para impresión UV',
      'v2-s4v': 'JPG, PNG, TIF y EPS, entre otros',
      'v2-s5v': 'Automático',
      'v2-s6v': 'Guía lineal Silent 2.0',
      'v2-d1v': '15–30 °C; humedad 20–80 %',
      'v2-d2v': 'Por agua y aire',
      'v2-d3v': 'Automático / manual',
      'v2-d4v': '110/220 V · 50–60 Hz',
      'v2-i1v': 'Tinta UV: CMYK, blanco y barniz',
      'v2-i2v': 'Sistema continuo de suministro',
      'v2-i3v': 'Vidrio, acrílico, madera, metal, envases, carcasas y artículos promocionales',
    };
    for (const [eid, value] of Object.entries(fields)) html = setField(html, eid, value);
    html = setField(html, 'v2-g3l', 'Dimensiones del equipo', 'label');
    html = setField(html, 'v2-g5l', 'Peso aproximado', 'label');
    const start = html.indexOf('  <section class="spec-section" style="--rows:9">');
    const end = html.indexOf('  <div class="footer-band">', start);
    if (start < 0 || end < 0) throw new Error('Missing legacy hidden specification table');
    html = html.slice(0, start) + html.slice(end);
  }

  if (html.includes('HF60902UV') || html.includes('hf60902uv')) {
    throw new Error(`Old model reference remains in ${target}`);
  }
  html = html.replace(/[ \t]+(?=\r?\n)/g, '').replace(/(?:\r?\n)+$/, '\n');
  fs.writeFileSync(target, html);
  console.log(path.relative(process.cwd(), target));
}

for (const name of ['aplicaciones', 'carcasa']) {
  fs.copyFileSync(path.join(src, 'assets', `${from}-${name}.png`), path.join(src, 'assets', `${to}-${name}.png`));
}
