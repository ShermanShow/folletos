// Selector de pie de página en la vista general del folleto: cambia las vistas previas y se envía al exportar.
(function () {
  var MODES = [['huenu', 'Huenú'], ['sys', 'Sistemas y Soluciones'], ['vacio', 'Vacío']];
  var MODE_KEY = 'huenu_pie_modo';
  function current() {
    var m = null;
    try { m = localStorage.getItem(MODE_KEY); } catch (e) {}
    return MODES.some(function (x) { return x[0] === m; }) ? m : 'huenu';
  }
  window.huenuPieMode = current;

  var button = document.getElementById('export-pdf');
  if (!button) return;
  var style = document.createElement('style');
  style.textContent =
    '.pie-picker{display:inline-flex;align-items:center;gap:8px;margin-left:auto;font:600 13px/1.2 Poppins,Arial,sans-serif;color:inherit;white-space:nowrap}' +
    '.pie-picker select{font:inherit;padding:7px 10px;border-radius:8px;border:1px solid #cfd6cf;background:#fff;color:#222;cursor:pointer}' +
    '.pie-picker + #export-pdf{margin-left:10px}' +
    '@media (max-width:860px){.pie-picker span{display:none}}';
  document.head.appendChild(style);

  var label = document.createElement('label');
  label.className = 'pie-picker';
  var text = document.createElement('span');
  text.textContent = 'Pie de página';
  var select = document.createElement('select');
  MODES.forEach(function (x) { var o = document.createElement('option'); o.value = x[0]; o.textContent = x[1]; select.appendChild(o); });
  select.value = current();
  label.appendChild(text);
  label.appendChild(select);
  button.parentNode.insertBefore(label, button);

  select.addEventListener('change', function () {
    try { localStorage.setItem(MODE_KEY, select.value); } catch (e) {}
    document.querySelectorAll('iframe').forEach(function (frame) {
      try { if (frame.contentWindow.HuenuPie) frame.contentWindow.HuenuPie.setMode(select.value); } catch (e) {}
    });
  });
})();
