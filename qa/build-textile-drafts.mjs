// Mechanical derivation of the three 620 mm textile drafts from the editable HR3002DT base.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('work/vercel-latest/src');
const base = Object.fromEntries(['-p1.html','-p2.html','-p3.html','.html','-print.html','.css'].map(suffix => [suffix, fs.readFileSync(path.join(root, 'hr3002dt' + suffix), 'utf8')]));
const models = {
  hr6002dt: {
    head:'Epson i1600 / i3200', shaker:'Shaker textil',
    heroSub:'Transfers textiles de mayor ancho para prendas, accesorios e indumentaria personalizada.',
    shakerTitle:'Shaker / ancho por confirmar',
    lead:'Sumá producción textil de mayor ancho con un flujo DTF completo',
    body:'El HUENÚ HR6002DT produce transfers textiles de hasta 620 mm sobre film PET. Integra impresión DTF, aplicación de polvo adhesivo, secado y take up para indumentaria personalizada, uniformes y merchandising textil.',
    page2sub:'Impresión, aplicación de polvo, secado y take up para producción textil de mayor ancho.',
    systems:['Cabezales Epson i1600 / i3200','Alimentación de film PET de 620 mm','Shaker para polvo adhesivo','Secador y calefacción frontal','Take up de film'],
    systemBodies:[
      'Configuración para producir transfers textiles con color, definición y base blanca sobre prendas claras, oscuras o de color.',
      'Permite trabajar con film DTF de mayor ancho, ampliando el formato de los transfers y la capacidad de producción textil.',
      'Distribuye el polvo adhesivo sobre el transfer impreso para preparar la estampa antes del secado.',
      'Acompaña el secado del transfer y ayuda a fijar el polvo adhesivo antes del rebobinado del film.',
      'Rebobina el film luego de la impresión, aplicación de polvo y secado para mantener una operación continua.'
    ],
    micro:['Display de control','Extracción de humo','Soporte de impresora'],
    microBodies:['Visualiza parámetros de operación del shaker.','Conexión para extracción durante el secado.','Integra impresora y shaker en un flujo compacto.'],
    general:['HR6002DT','DTF Textil','Epson i1600 / i3200','CMYK + Blanco','620 mm','Film PET','RJ45 / cable interface','Maintop 6.1 / Photoprint / Print Factory'],
    shakerSpecs:['Por confirmar: folleto indica D300 / 330 mm','Secador / take up / soporte / calefacción frontal / display / extracción','3600 W','20 °C a 35 °C / Humedad 35% a 65% RH','1250 × 720 × 970 mm','110 kg','1350 × 800 × 1040 mm','140 kg'],
    speeds:['Hasta 8 m²/h','Hasta 5 m²/h','Hasta 3 m²/h'],
    energy:['400 W','AC110V ±10% / AC220V ±10%, 50/60 Hz','20 °C a 35 °C / Humedad 35% a 65% RH','1150 × 610 × 500 mm','88 kg','1300 × 750 × 560 mm','113 kg'],
    summary:'DTF Textil de mayor ancho para producción de prendas personalizadas.',
    summaryBody:'El HUENÚ HR6002DT combina impresión DTF Textil de 620 mm, cabezales Epson i1600 / i3200, sistema CMYK + Blanco, film PET y shaker con secado y take up para indumentaria, merchandising, uniformes y trabajos bajo demanda.',
    ink:'CMYK + Blanco'
  },
  hr6004dt: {
    head:'Epson I3200A1', shaker:'Shaker + secado IR',
    heroSub:'Transfers textiles de alta productividad para prendas e indumentaria personalizada.',
    shakerTitle:'Shaker con secado IR',
    lead:'Producción textil DTF con mayor rendimiento',
    body:'El HUENÚ HR6004DT combina impresión DTF de 620 mm, film PET, shaker con secado infrarrojo y entrega inteligente del material para producir transfers textiles destinados a indumentaria, merchandising, uniformes y trabajos bajo demanda.',
    page2sub:'Impresión, polvo, secado infrarrojo y entrega inteligente para producción textil continua.',
    systems:['Cabezal Epson I3200A1','Ancho de impresión de 620 mm','Shaker para polvo adhesivo','Secado infrarrojo de alta capacidad','Entrega inteligente del material'],
    systemBodies:[
      'Configuración orientada a producción DTF Textil con color, definición y rendimiento estable sobre film PET.',
      'Permite transfers textiles de mayor formato para prendas, logos grandes y diseños continuos.',
      'Aplica y distribuye polvo adhesivo sobre el transfer impreso antes del secado.',
      'El secado con 14 tubos infrarrojos y 1300 mm de recorrido ayuda a fijar el polvo para la posterior aplicación térmica.',
      'El sistema inteligente de entrega ordena la salida del material para un flujo de producción continuo.'
    ],
    micro:['Control de producción','Secado infrarrojo','Entrega de material'],
    microBodies:['Supervisión de parámetros de impresión.','14 tubos infrarrojos para fijación del polvo.','Salida inteligente para trabajo continuo.'],
    general:['HR6004DT','DTF Textil','Epson I3200A1','Tinta DTF','620 mm','Film PET / papel sintético PP','USB 2.0','PhotoPrint'],
    shakerSpecs:['700 mm de ancho de trabajo','Secado IR / entrega inteligente / 14 tubos infrarrojos','9500 W','10 °C a 40 °C','3000 × 1280 × 1200 mm','No informado','2200 × 1260 × 1260 mm','300 kg'],
    speeds:['Hasta 32 m²/h','Hasta 20 m²/h','Hasta 14 m²/h'],
    energy:['No informada','AC110V ±10% / AC220V ±10%, 50/60 Hz','20 °C a 35 °C / Humedad 35% a 65% RH','1785 × 790 × 1613 mm','180 kg','1880 × 970 × 740 mm','200 kg'],
    summary:'DTF Textil de alto rendimiento para producción continua.',
    summaryBody:'El HUENÚ HR6004DT combina impresión DTF Textil de 620 mm, cabezal Epson I3200A1, film PET, shaker con secado infrarrojo y entrega inteligente del material. Una solución para transfers textiles de mayor volumen destinados a prendas, uniformes y merchandising.',
    ink:'Tinta DTF',
    feature3:'Hasta 32 m²/h', feature3sub:'Alta productividad'
  },
  hr6007dt: {
    head:'Epson I3200A1', shaker:'Shaker avanzado',
    heroSub:'Transfers textiles con control operativo para producción continua.',
    shakerTitle:'Shaker inteligente',
    lead:'Producción textil continua con control de principio a fin',
    body:'El HUENÚ HR6007DT combina impresión DTF de 620 mm sobre film PET con un shaker de control de polvo, secado integrado, filtro de humo y aceite, pantalla táctil, cinta inteligente y take up con tensión automática.',
    page2sub:'Impresión, control de polvo, secado y salida inteligente para producción textil continua.',
    systems:['Cabezal Epson I3200A1','Recorrido de film PET de 620 mm','Control de polvo adhesivo','Secado con filtro de humo y aceite','Cinta inteligente y take up automático'],
    systemBodies:[
      'Configuración orientada a producción DTF Textil con definición, estabilidad y rendimiento sobre film PET.',
      'El recorrido de film PET permite producir transfers de hasta 620 mm de ancho.',
      'El shaker controla la aplicación de polvo adhesivo sobre el transfer impreso.',
      'El secado regulable y el filtro de humo y aceite ayudan a mantener controlado el proceso.',
      'La cinta de velocidad inteligente y el take up con tensión automática ordenan la salida del material.'
    ],
    micro:['Pantalla táctil','Filtro de humo y aceite','Control de tensión'],
    microBodies:['Control multimodo del proceso.','Ayuda a tratar humo y aceite del secado.','Take up con tensión automática.'],
    general:['HR6007DT','DTF Textil','Epson I3200A1','Tinta DTF blanca (CMYK + Blanco por confirmar)','620 mm','Film PET','USB 3.0','PhotoPrint'],
    shakerSpecs:['0 a 650 mm','Pantalla táctil / filtro de humo y aceite / cinta inteligente / take up','4000 a 8000 W','Hasta 140 °C','2610 × 1125 × 1020 mm','340 kg','2550 × 1160 × 1250 mm','456 kg'],
    speeds:['48 m²/h a 360 × 2400 dpi','27 m²/h a 360 × 3600 dpi','No informada'],
    energy:['No informada','AC110V ±10% / AC220V ±10%, 50/60 Hz','20 °C a 35 °C / Humedad 35% a 65% RH','2045 × 1025 × 1560 mm','350 kg','2130 × 930 × 730 mm','425 kg'],
    summary:'DTF Textil con control operativo para producción continua.',
    summaryBody:'El HUENÚ HR6007DT combina impresión DTF Textil de 620 mm, cabezal Epson I3200A1, film PET y shaker con control de polvo, secado, filtro de humo y aceite, pantalla táctil, cinta inteligente y take up con tensión automática.',
    ink:'Tinta DTF blanca',
    feature3:'Hasta 48 m²/h', feature3sub:'Alta productividad'
  }
};

function replaceText(html, id, text) {
  const pattern = new RegExp(`(data-eid="${id}"[^>]*>)[^<]*(</(?:span|p|strong|small|h2|h3|div)>)`);
  if (!pattern.test(html)) throw new Error('Could not find ' + id);
  const result = html.replace(pattern, (_, start, end) => start + text + end);
  return result;
}

for (const [model, info] of Object.entries(models)) {
  for (const suffix of ['-p1.html','-p2.html','-p3.html','.html','-print.html']) {
    let html = base[suffix].replaceAll('HR3002DT', model.toUpperCase()).replaceAll('hr3002dt-p', model + '-p').replaceAll('hr3002dt-print.html', model + '-print.html').replaceAll('hr3002dt.html', model + '.html').replaceAll('data-model="hr3002dt"', `data-model="${model}"`);
    html = html.replaceAll('href="/hr3002dt.css"', `href="/${model}.css"`);
    html = html.replaceAll('hr3002dt-machine.png', `${model}-machine.png`).replaceAll('hr3002dt-system.png', `${model}-machine.png`);
    if (suffix === '-p1.html') {
      html=html.replace(`${model}-machine.png`,`${model}-hero.png`);
      html = html.replaceAll('330 mm', '620 mm').replace('2 Epson i1600', info.head).replace('Shaker D300', info.shaker);
      html = replaceText(html, 'subtitle', info.heroSub);
      if(model !== 'hr6002dt') html=html.replace('<small>CMYK + Blanco</small>',`<small>${info.ink}</small>`);
      html = html.replace('<em>Sumá producción</em><br>textil con un flujo<br>DTF completo', `<em>${info.lead.split(' ').slice(0,2).join(' ')}</em><br>${info.lead.split(' ').slice(2).join(' ')}`);
      html = replaceText(html, 'message-body', info.body);
      if (info.feature3) html = html.replace('<strong>Film PET</strong><small>Producción DTF Textil</small>', `<strong>${info.feature3}</strong><small>${info.feature3sub}</small>`);
      if (info.feature3) html = html.replace('data-eid="feat-icon-3" src="/assets/hr3002dt-film.svg"','data-eid="feat-icon-3" src="/assets/hr3002dt-bars.svg"');
      if (model==='hr6004dt') html=html.replace('<strong>Shaker + secado IR</strong><small>Secado y take up</small>','<strong>Shaker + secado IR</strong><small>Flujo continuo</small>');
      if (model==='hr6007dt') html=html.replace('<strong>Shaker avanzado</strong><small>Secado y take up</small>','<strong>Shaker avanzado</strong><small>Control y take up</small>');
    }
    if (suffix === '-p2.html') {
      html = html.replace(`${model}-machine.png`, `${model}-p2-main.png`);
      html = html.replaceAll('330 mm', '620 mm');
      html = replaceText(html, 'subtitle', info.page2sub);
      const oldTitles=['2 cabezales Epson i1600','Alimentación de film PET de 620 mm','Shaker para polvo adhesivo','Secador integrado','Take up de film'];
      for (let i=0;i<5;i++) html=html.replace(`<span>${oldTitles[i]}</span>`,`<span>${info.systems[i]}</span>`);
      for (let i=0;i<5;i++) html=replaceText(html,`card${i+1}-body`,info.systemBodies[i]);
      for (let i=0;i<3;i++) html=replaceText(html,`micro${i+1}-title`,info.micro[i]);
      for (let i=0;i<3;i++) html=replaceText(html,`micro${i+1}-body`,info.microBodies[i]);
      html=html.replaceAll('hr3002dt-heads.png', `${model}-printer.png`).replaceAll('hr3002dt-film.png',`${model}-printer.png`).replaceAll(`${model}-powder.png`,`${model}-shaker.png`).replaceAll('hr3002dt-dryer.png',`${model}-shaker.png`).replaceAll('hr3002dt-takeup.png',`${model}-shaker.png`);
      html=html.replaceAll('hr3002dt-display.png',`${model}-printer.png`).replaceAll('hr3002dt-heater.png',`${model}-shaker.png`).replaceAll('hr3002dt-support.png',`${model}-shaker.png`);
      html=replaceText(html,'inks-body',`Sistema de ${info.ink} para producir transfers textiles sobre film PET. La configuración de color y blanco queda sujeta a la versión comercial del equipo.`);
      if(model==='hr6007dt') html=replaceText(html,'inks-caption','Configuración de color + blanco por confirmar.');
    }
    if (suffix === '-p3.html') {
      html=html.replace('>Shaker D300</span>',`>${info.shakerTitle}</span>`);
      for(let i=0;i<8;i++) html=replaceText(html,`g${i+1}-value`,info.general[i]);
      for(let i=0;i<8;i++) html=replaceText(html,`s${i+1}-value`,info.shakerSpecs[i]);
      for(let i=0;i<3;i++) html=replaceText(html,`p${i+1}-value`,info.speeds[i]);
      for(let i=0;i<7;i++) html=replaceText(html,`e${i+1}-value`,info.energy[i]);
      html=replaceText(html,'summary-body',info.summaryBody);
      html=html.replace('<em>DTF Textil compacto</em> para producción de prendas personalizadas.',`<em>${info.summary.split(' ').slice(0,2).join(' ')}</em> ${info.summary.split(' ').slice(2).join(' ')}`);
      if(model==='hr6007dt') html=html.replace('Velocidad 8 pass','Velocidad adicional');
    }
    if (suffix === '.html') {
      html=html.replaceAll('Equipo DTF Textil de 330 mm','Equipo DTF Textil de 620 mm');
    }
    fs.writeFileSync(path.join(root,model+suffix),html);
  }
  fs.writeFileSync(path.join(root,model+'.css'),base['.css']+`\n.p3 .row{font-size:7.6pt}.p3 .summary p{font-size:8.4pt}\n`);
}
console.log('Generated',Object.keys(models).join(', '));
