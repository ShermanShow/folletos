(() => {
  const summaries = window.expoSummaries;
  const params = new URLSearchParams(location.search);
  const id = params.get('modelo');
  if (!summaries[id]) { location.replace('resumenes-feria.html'); return; }
  const item = summaries[id];
  const $ = (selector) => document.querySelector(selector);
  const status = (message) => { $('#status').textContent = message; };
  const storageKey = 'expo-resumen-' + id + '-v1';
  const store = {
    async load() {
      try {
        const response = await fetch('/api/state?key=' + encodeURIComponent(storageKey));
        if (response.ok) { const data = await response.json(); return data.state || data; }
      } catch (_) {}
      try { return JSON.parse(localStorage.getItem(storageKey)); } catch (_) { return null; }
    },
    async save(value) {
      localStorage.setItem(storageKey, JSON.stringify(value));
      const response = await fetch('/api/state?key=' + encodeURIComponent(storageKey), { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({state:value}) });
      if (!response.ok) throw new Error('No se pudo guardar en el servidor. Quedó guardado solo en este navegador.');
    }
  };
  const fields = [];
  function addField(element, value) { element.textContent = value; fields.push(element); }
  addField($('#brand'), item.brand); addField($('#model'), item.model); addField($('#category'), item.category);
  addField($('#intro'), item.intro); addField($('#use'), item.use);
  $('#footer-brand').textContent = item.brand; $('#footer-model').textContent = item.model;
  const select = $('#model-select');
  Object.entries(summaries).forEach(([key, other]) => { const option = new Option(other.brand + ' · ' + other.model, key); select.add(option); });
  select.value = id;
  select.addEventListener('change', () => { location.href = 'resumen-feria.html?modelo=' + encodeURIComponent(select.value); });
  $('#base-pdf').href = 'pdfs/resumenes-feria/' + id + '.pdf';
  $('#base-pdf').download = 'ficha-' + id + '.pdf';
  $('#page').classList.toggle('other', item.brand !== 'HUENÚ');
  document.title = item.brand + ' ' + item.model + ' · Ficha técnica';
  item.specs.forEach(([label, value]) => {
    const row = document.createElement('div'); row.className = 'spec-row';
    const dt = document.createElement('dt'); const dd = document.createElement('dd');
    addField(dt, label); addField(dd, value); row.append(dt, dd); $('#specs').append(row);
  });
  $('#source-link').href = item.source;
  store.load().then(saved => {
    if (saved && Array.isArray(saved.fields)) saved.fields.slice(0, fields.length).forEach((value, index) => fields[index].textContent = value);
  });
  let editing = false;
  $('#edit-button').addEventListener('click', () => {
    editing = !editing;
    fields.forEach(field => { field.contentEditable = editing ? 'true' : 'false'; });
    $('#edit-button').textContent = editing ? 'Dejar de editar' : 'Editar textos';
    $('#save-button').hidden = !editing;
    status(editing ? 'Hacé clic en cualquier texto de la hoja para editarlo. Después guardá los cambios.' : '');
  });
  $('#save-button').addEventListener('click', async () => {
    try { await store.save({fields:fields.map(field => field.textContent)}); status('Cambios guardados. Para obtener el PDF actualizado, usá “Exportar esta hoja a PDF”.'); }
    catch (error) { status(error.message); }
  });
  $('#print-button').addEventListener('click', () => window.print());
  window.expoSummaryReady = true;
})();
