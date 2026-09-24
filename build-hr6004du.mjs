import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Adaptación solo de copy a partir de las bases HTML entregadas por el usuario.
const sourceDir = 'C:/Users/emart/Downloads/';
const targetDir = new URL('src/', import.meta.url);
const imageHashes = html => [...html.matchAll(/data:image\/[^"'\s<>]+/g)]
  .map(match => createHash('sha256').update(match[0]).digest('hex'));
function replaceOnce(html, before, after) {
  const count = html.split(before).length - 1;
  if (count !== 1) throw Error('Se esperaba una coincidencia de ' + before.slice(0, 80) + '; hay ' + count);
  return html.replace(before, after);
}
function setText(html, eid, value) {
  const re = new RegExp('(<([a-z][a-z0-9-]*)\\b[^>]*\\bdata-eid="' + eid + '"[^>]*>)([\\s\\S]*?)(<\\/\\2>)', 'g');
  let count = 0;
  html = html.replace(re, (_match, start, _tag, _old, end) => {
    count++;
    return start + value + end;
  });
  if (count !== 1) throw Error('No se encontró una única vez data-eid=' + eid + ': ' + count);
  return html;
}
function adapt(page, changes, extras = []) {
  const original = readFileSync(sourceDir + 'HR3001DU_hoja' + page + '.html', 'utf8');
  let html = replaceOnce(original, '<title>Huenú HR3001DU — Hoja ' + page + '</title>', '<title>Huenú HR6004DU — Hoja ' + page + '</title>');
  for (const [eid, value] of Object.entries(changes)) html = setText(html, eid, value);
  for (const [before, after] of extras) html = replaceOnce(html, before, after);
  if (page === 1) {
    html = replaceOnce(html, '</style></head>', '.p1 .applications p{position:relative;z-index:1;background:#fff}.p1 .opportunities .panel-heading{font:800 12pt/1 Roboto Condensed,Montserrat,sans-serif;white-space:nowrap}.p1 .opportunity strong{font-size:7.5pt}.p1 .opportunity small{font-size:6pt;line-height:1.05}</style></head>');
  }
  if (page === 3) {
    html = replaceOnce(html, '</style></head>', '.p3 .section:last-child .value{font-size:8pt;line-height:1.05}</style></head>');
  }
  html = replaceOnce(html, '</head>', '<style id="hr6004du-editor-layout">html:not(.print-mode) body{padding-top:44px;background:#dfe1e4}</style></head>');
  html = replaceOnce(
    html,
    '<body data-sheet="p' + page + '">',
    '<body data-sheet="p' + page + '"><nav class="toolbar"><a href="/hr6004du.html">← HR6004DU</a><button id="edit-toggle" type="button">Activar edición</button><span class="hint">Arrastrá para mover · Doble clic en texto para editar; en foto o ícono para reemplazar · Azul: ancho · Naranja: tamaño</span><span class="status" id="edit-status"></span><button id="save" type="button">Guardar</button><button id="download-html" type="button">💾 Descargar HTML</button></nav>'
  );
  html = replaceOnce(html, '</body>', '<script src="/hr6004du-editor.js"></script></body>');
  const before = imageHashes(original), after = imageHashes(html);
  if (JSON.stringify(before) !== JSON.stringify(after)) throw Error('Se alteró una imagen o un ícono en la hoja ' + page);
  writeFileSync(new URL('hr6004du-p' + page + '.html', targetDir), html, 'utf8');
  console.log('Hoja ' + page + ': ' + Object.keys(changes).length + ' textos, ' + before.length + ' imágenes/íconos intactos');
}

adapt(1, {
  badge: 'HUENÚ HR6004DU',
  title: '<em>Equipo DTF UV</em> de 620 mm',
  subtitle: 'Transfers UV de mayor formato para personalización de objetos',
  'feature-1': '<strong>620 mm</strong><small>Ancho de impresión</small>',
  'feature-2': '<strong>4 cabezales Epson</strong><small>Mayor productividad DTF UV</small>',
  'feature-3': '<strong>Film AB / 3D</strong><small>Aplicaciones transferibles</small>',
  'feature-4': '<strong>Impresión + laminado</strong><small>Proceso integrado</small>',
  'intro-name': 'HUENÚ HR6004DU',
  'intro-model': 'Equipo DTF UV de 620 mm',
  'intro-sub': 'Transfers UV de mayor formato para personalización de objetos.',
  'intro-body': 'Impresión, curado y laminado integrados para producir aplicaciones DTF UV sobre film AB y film siliconado blanco 3D, listas para transferir sobre vidrio, metal, cerámica, plásticos, madera, packaging y productos promocionales.',
  'message-title': 'Mayor ancho para ampliar la producción DTF UV',
  'message-body': 'El HUENÚ HR6004DU permite producir stickers transferibles UV de 620 mm, con color, blanco, barniz y efectos de textura para sumar valor en productos personalizados, envases, regalos corporativos y merchandising.',
  'applications-title': 'Aplicaciones',
  'applications-body': 'Transfers UV para personalizar objetos, envases y superficies rígidas con terminaciones de alto valor.',
  'opportunities-title': 'Oportunidades de negocio',
  'opp-1': '<strong>Merchandising corporativo</strong><small>Transfers para regalos empresariales, objetos promocionales y productos institucionales.</small>',
  'opp-2': '<strong>Packaging personalizado</strong><small>Aplicaciones para envases, cajas, bolsas, etiquetas especiales y presentaciones de marca.</small>',
  'opp-3': '<strong>Regalería y souvenirs</strong><small>Producción flexible para fechas especiales, eventos, turismo y venta minorista.</small>',
  'opp-4': '<strong>Objetos rígidos y texturas 3D</strong><small>Personalización de vidrio, metal, cerámica, plástico y madera con efectos de mayor presencia visual.</small>',
});

adapt(2, {
  badge: 'HUENÚ HR6004DU',
  title: '<em>Sistemas</em> del equipo',
  subtitle: 'Mayor ancho, estabilidad de film y proceso integrado para producción DTF UV continua.',
  'card1-title': '<b>1</b> Impresión y laminado integrados',
  'card1-body': 'Integra impresión y laminado en un mismo flujo, reduciendo manipulación, tiempos operativos y pasos intermedios.',
  'card2-title': '<b>2</b> Lámpara UV de alta potencia',
  'card2-body': 'Permite el curado de la tinta UV durante el proceso, acompañando la producción de transfers listos para aplicar.',
  'card3-title': '<b>3</b> Plataforma honeycomb de succión',
  'card3-body': 'Ayuda a mantener el film plano y estable durante la impresión, reduciendo arrugas, arqueos y desplazamientos.',
  'card4-title': '<b>4</b> 4 cabezales Epson',
  'card4-body': 'Configuración de 4 cabezales orientada a mayor productividad, definición y estabilidad en producción DTF UV de 620 mm.',
  'card5-title': '<b>5</b> Anticolisión y elevación del cabezal',
  'card5-body': 'El dispositivo anticolisión y la elevación automática del cabezal contribuyen al cuidado del equipo y facilitan limpieza y mantenimiento.',
  'micro1-title': 'Sistema de control Hoson',
  'micro1-body': 'Procesamiento estable para producción continua.',
  'micro2-title': 'Guía THK silenciosa',
  'micro2-body': 'Desplazamiento suave y preciso del carro.',
  'micro3-title': 'Alimentación y take up',
  'micro3-body': 'Sistema para flujo continuo de film.',
  'dtf-title': 'Sistema DTF UV',
  'dtf-body': 'El proceso DTF UV imprime sobre film con tinta UV, combinando color, blanco y barniz para producir transfers adhesivos aplicables sobre objetos y superficies rígidas. Compatible con film AB y film siliconado blanco 3D.',
  'inks-title': 'Sistema de tintas',
  'inks-body': 'Configuración para producir color, blanco, barniz y aplicaciones con barniz dorado según modo de impresión.',
  'inks-note': 'Color para impacto visual, blanco para opacidad, barniz para terminaciones diferenciales y gold varnish para aplicaciones especiales.',
}, [
  ['<small>Film A</small>', '<small>Film AB</small>'],
  ['CMYK: color. W: blanco. V: barniz.', 'CMYK: color. W: blanco. V: barniz. GV: barniz dorado.'],
]);

adapt(3, {
  badge: 'HUENÚ HR6004DU',
  title: '<em>Especificaciones</em> técnicas',
  subtitle: 'Equipo DTF UV — Color / Blanco / Barniz',
  'value-0-0': 'HR6004DU',
  'value-0-1': 'DTF UV',
  'value-0-2': '620 mm',
  'value-0-3': 'UV DTF printer',
  'label-0-4': 'Cabezales',
  'value-0-4': '4 Epson I3200 / 4 Epson I1600, según versión',
  'value-0-5': 'Film AB / White Silicone 3D Printing Film',
  'value-0-6': 'Tinta UV',
  'value-0-7': 'CMYK / W / V / GV',
  'value-0-8': 'Bulk ink system with ink cartridges',
  'value-1-0': 'CMYK + W + CMYK + V',
  'value-1-1': 'W + CMYK + V + Gold Varnish',
  'label-1-2': 'Velocidad con Epson I3200',
  'value-1-2': 'High-res, 720 × 1800 dpi: hasta 7 m²/h',
  'label-1-3': 'Velocidad con Epson I1600',
  'value-1-3': 'High-res, 720 × 1800 dpi: hasta 3,5 m²/h',
  'label-1-4': 'Material compatible',
  'value-1-4': 'Film AB / film siliconado blanco 3D',
  'label-1-5': 'Terminaciones',
  'value-1-5': 'Barniz, barniz dorado y textura 3D',
  'value-1-6': '3,8 / 6,2 / 9,3 pl',
  'value-1-7': 'RIIN / Maintop / Photoprint opcional',
  'value-2-0': 'Lámpara UV de alta potencia',
  'value-2-1': 'Rodillo doble de silicona',
  'value-2-2': 'Plataforma honeycomb de aluminio con succión',
  'value-2-3': 'Hoson Control System',
  'value-2-4': 'THK Silent Guide Rail',
  'label-2-5': 'Cabezal y seguridad',
  'value-2-5': 'Elevación automática y dispositivo anticolisión',
  'label-2-6': 'Alimentación y take up',
  'value-2-6': 'Single-power feeding and take-up system',
  'value-3-0': '20 °C a 28 °C',
  'value-3-1': '38 % a 65 %',
  'value-3-2': '660 W',
  'value-3-3': '500 W',
  'value-3-4': '800 W',
  'value-3-5': '1970 × 1080 × 1570 mm',
  'value-3-6': '150 kg',
  'value-3-7': '2260 × 940 × 735 mm',
  'value-3-8': '200 kg',
  'value-4-0': 'Vidrio, cerámica, metal, plásticos, madera y productos de papel',
  'value-4-1': 'Envases, packaging, botellas, vasos, souvenirs, merchandising y artículos promocionales',
  'value-4-2': 'Stickers transferibles UV, series cortas, personalización bajo demanda, film AB y textura 3D',
});

let preview = readFileSync(new URL('hr3001du.html', targetDir), 'utf8');
preview = preview.replaceAll('hr3001du', 'hr6004du').replaceAll('HR3001DU', 'HR6004DU');
preview = preview.replaceAll('320 mm', '620 mm').replaceAll('Folleto editable', 'Borrador de copy');
preview = preview.replace('Marcá las hojas que querés incluir en la exportación o abrí una para editarla.', 'Textos adaptados al HR6004DU. Las imágenes e íconos siguen siendo los de las bases HR3001DU. Podés abrir y editar cada hoja o exportar un PDF de borrador.');
writeFileSync(new URL('hr6004du.html', targetDir), preview, 'utf8');
let printable = readFileSync(new URL('hr3001du-print.html', targetDir), 'utf8');
printable = printable.replaceAll('hr3001du', 'hr6004du').replaceAll('HR3001DU', 'HR6004DU');
writeFileSync(new URL('hr6004du-print.html', targetDir), printable, 'utf8');
console.log('Vista previa y selección de hojas para PDF preparadas');
