// Pie de página intercambiable: Huenú (original), Sistemas y Soluciones o Vacío.
// Se elige con ?pie=huenu|sys|vacio (exportación) o con el selector de la barra (queda recordado en este navegador).
// La imagen de Sistemas y Soluciones se mueve arrastrando y cambia de tamaño con la rueda, solo en modo edición;
// su posición es una sola por modelo de pie y se comparte entre todos los folletos.
(function () {
  var MODES = { huenu: 'Huenú', sys: 'Sistemas y Soluciones', vacio: 'Vacío' };
  var MODE_KEY = 'huenu_pie_modo';
  var BANNER_SRC = '/assets/pie-sistemas-y-soluciones.png';
  var BANNER_RATIO = 698 / 61;

  var footer = document.querySelector('.footer, .foot');
  if (!footer) return;
  // Tres modelos de pie: hojas 1-2 (div.footer), hojas 3 (footer.footer) y DT/DU (footer.foot).
  var kind = footer.classList.contains('foot') ? 'foot' : (footer.tagName === 'FOOTER' ? 'footer_p3' : 'footer');
  var STATE_KEY = 'huenu_pie_sys_' + kind;

  function validMode(m) { return Object.prototype.hasOwnProperty.call(MODES, m) ? m : null; }
  function storedMode() { try { return validMode(localStorage.getItem(MODE_KEY)); } catch (e) { return null; } }
  var mode = validMode(new URLSearchParams(location.search).get('pie')) || storedMode() || 'huenu';

  var css = document.createElement('style');
  css.textContent =
    // !important: algunos modelos tienen reglas para todas las imágenes del pie (ej. .foot img{height:11mm}).
    'img.pie-sys{position:absolute;display:none;height:auto!important;max-width:none!important;max-height:none!important;object-fit:fill!important;z-index:50;user-select:none;-webkit-user-drag:none}' +
    'body[data-pie="sys"] .pie-sys{display:block}' +
    'body[data-pie="sys"] .pie-hide-sys,body[data-pie="vacio"] .pie-hide-vacio{visibility:hidden!important}' +
    'body.edit-active[data-pie="sys"] .pie-sys,body.editing[data-pie="sys"] .pie-sys{cursor:move;outline:1px dashed #39d322;outline-offset:1px}' +
    '.pie-picker{display:inline-flex;align-items:center;gap:6px;margin-left:10px;font:600 12px/1.2 Poppins,Arial,sans-serif;color:inherit;white-space:nowrap}' +
    '.pie-picker select{font:inherit;padding:4px 6px;border-radius:6px;border:1px solid #bbb;background:#fff;color:#222}' +
    '@media print{.pie-sys{outline:none!important}.pie-picker{display:none!important}}';
  document.head.appendChild(css);

  // El logo de Huenú se mantiene en "Sistemas y Soluciones"; el resto (contacto) se oculta.
  var logo = footer.querySelector('[data-eid="footer-logo"],[data-eid="p3-footer-logo"]');
  while (logo && logo.parentElement !== footer) logo = logo.parentElement;
  Array.prototype.forEach.call(footer.children, function (child) {
    child.classList.add('pie-hide-vacio');
    if (child !== logo) child.classList.add('pie-hide-sys');
  });

  var banner = document.createElement('img');
  banner.className = 'pie-sys';
  banner.src = BANNER_SRC;
  banner.alt = 'Sistemas y Soluciones';
  banner.draggable = false;
  footer.appendChild(banner);

  var probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;width:100mm;height:0';
  document.body.appendChild(probe);
  function pxPerMm() { return (probe.offsetWidth || 377.95) / 100; }

  // Posición inicial: alineada a la derecha, donde estaba el contacto, y centrada en alto.
  function defaultGeo() {
    var k = pxPerMm(), fw = footer.offsetWidth / k, fh = footer.offsetHeight / k;
    var logoRight = logo ? (logo.offsetLeft + logo.offsetWidth) / k : 0, right = fw;
    Array.prototype.forEach.call(footer.children, function (c) {
      if (c === logo || c === banner || !c.offsetWidth) return;
      right = Math.max(logoRight, (c.offsetLeft + c.offsetWidth) / k);
    });
    if (right <= logoRight + 20) right = fw;
    var width = Math.max(30, Math.min(120, right - logoRight - 8));
    return { left: right - width, top: (fh - width / BANNER_RATIO) / 2, width: width };
  }

  var geo = null;
  function readLocal() { try { return JSON.parse(localStorage.getItem(STATE_KEY)); } catch (e) { return null; } }
  function validGeo(g) { return g && isFinite(g.left) && isFinite(g.top) && isFinite(g.width) && g.width > 0; }
  function applyGeo() {
    if (!geo) geo = defaultGeo();
    banner.style.left = geo.left + 'mm';
    banner.style.top = geo.top + 'mm';
    banner.style.width = geo.width + 'mm';
  }

  var saveTimer = null;
  function save() {
    geo.updatedAt = Date.now();
    try { localStorage.setItem(STATE_KEY, JSON.stringify(geo)); } catch (e) {}
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      fetch('/api/state?key=' + STATE_KEY, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: geo }) }).catch(function () {});
    }, 600);
  }

  function setMode(m, remember) {
    m = validMode(m) || 'huenu';
    mode = m;
    document.body.setAttribute('data-pie', m);
    if (m === 'sys') applyGeo();
    if (picker) picker.value = m;
    if (remember) { try { localStorage.setItem(MODE_KEY, m); } catch (e) {} }
  }

  function editing() { return document.body.classList.contains('edit-active') || document.body.classList.contains('editing'); }

  // Controles propios: no deben llegar a los editores de cada hoja (arrastre, doble click para reemplazar, etc.).
  banner.addEventListener('mousedown', function (e) {
    e.stopPropagation();
    if (!editing()) return;
    e.preventDefault();
    var k = pxPerMm(), sx = e.clientX, sy = e.clientY, start = { left: geo.left, top: geo.top };
    var scale = banner.getBoundingClientRect().width / banner.offsetWidth || 1; // vista previa escalada
    function move(ev) {
      geo.left = start.left + (ev.clientX - sx) / scale / k;
      geo.top = start.top + (ev.clientY - sy) / scale / k;
      applyGeo();
    }
    function up() { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); save(); }
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
  banner.addEventListener('wheel', function (e) {
    if (!editing()) return;
    e.preventDefault();
    e.stopPropagation();
    var width = Math.max(20, geo.width + (e.deltaY < 0 ? 2 : -2)), dw = width - geo.width;
    geo.left -= dw / 2;
    geo.top -= dw / BANNER_RATIO / 2;
    geo.width = width;
    applyGeo();
    save();
  }, { passive: false });
  ['click', 'dblclick'].forEach(function (type) { banner.addEventListener(type, function (e) { e.stopPropagation(); }); });

  // Selector en la barra de edición de la hoja.
  var picker = null;
  var toolbar = document.querySelector('#edit-toolbar, nav.toolbar, .toolbar');
  if (toolbar) {
    var label = document.createElement('label');
    label.className = 'pie-picker';
    label.appendChild(document.createTextNode('Pie:'));
    picker = document.createElement('select');
    Object.keys(MODES).forEach(function (m) { var o = document.createElement('option'); o.value = m; o.textContent = MODES[m]; picker.appendChild(o); });
    picker.addEventListener('change', function () { setMode(picker.value, true); });
    label.appendChild(picker);
    toolbar.appendChild(label);
  }

  var local = readLocal();
  if (validGeo(local)) geo = local;
  setMode(mode, false);
  fetch('/api/state?key=' + STATE_KEY, { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (remote) {
      var g = remote && remote.state;
      if (!validGeo(g) || (geo && geo.updatedAt && Number(g.updatedAt || 0) <= geo.updatedAt)) return;
      geo = g;
      try { localStorage.setItem(STATE_KEY, JSON.stringify(geo)); } catch (e) {}
      if (mode === 'sys') applyGeo();
    }).catch(function () {});

  window.HuenuPie = { setMode: function (m) { setMode(m, false); }, getMode: function () { return mode; } };
})();
