(() => {
  const page = document.querySelector('.page');
  if (!page) return;
  const model = document.body.dataset.model || 'hr3001du';
  const relativeLayout = model === 'feria-hr3002dt' || model === 'teneth-fc7090u';
  const key = 'huenu_editor_state_' + model + '_v4_' + document.body.dataset.sheet;
  const status = document.getElementById('edit-status');
  const toggle = document.getElementById('edit-toggle');
  const saveButton = document.getElementById('save');
  page.querySelectorAll('svg.icon-crop').forEach((icon, index) => {
    if (!icon.dataset.eid) icon.dataset.eid = 'icon-' + (index + 1);
  });
  if (relativeLayout) page.querySelectorAll('[data-eid]').forEach(el => el.setAttribute('data-move', ''));
  const elements = [...page.querySelectorAll('[data-eid]')];
  const byId = Object.fromEntries(elements.map(el => [el.dataset.eid, el]));
  let editing = false, selected = null, dirty = false, state = {};
  const mmPerPixel = () => 210 / page.getBoundingClientRect().width;
  const setStatus = message => { if (status) status.textContent = message; };
  const blue = document.createElement('i'), orange = document.createElement('i');
  blue.className = 'edit-handle blue'; orange.className = 'edit-handle orange';
  blue.title = 'Arrastrar para cambiar el ancho';
  orange.title = 'Arrastrar hacia un costado o hacia abajo para cambiar el tamaño';
  page.append(blue, orange);
  const isImage = el => el && el.tagName === 'IMG';
  const isIcon = el => el && el.matches('svg.icon-crop');
  const isGraphic = el => isImage(el) || isIcon(el);
  const safeImageUrl = url => typeof url === 'string' && (/^\/assets\//.test(url) || /^\/api\/image\?path=/.test(url));
  function positionHandles() {
    const visible = editing && selected;
    blue.classList.toggle('selected', !!visible);
    orange.classList.toggle('selected', !!visible);
    if (!visible) return;
    const r = selected.getBoundingClientRect(), p = page.getBoundingClientRect();
    blue.style.left = (r.right - p.left - 4) + 'px';
    blue.style.top = (r.top - p.top + r.height / 2 - 10) + 'px';
    orange.style.left = (r.right - p.left - 5) + 'px';
    orange.style.top = (r.bottom - p.top - 5) + 'px';
  }
  function markDirty() { dirty = true; setStatus('Cambios sin guardar'); positionHandles(); }
  function snapshot(el) {
    const entry = state[el.dataset.eid] || {};
    if (el.hasAttribute('data-text')) entry.html = el.innerHTML;
    if (isImage(el)) {
      entry.src = el.getAttribute('src');
      if (el.style.objectFit) entry.objectFit = el.style.objectFit;
      if (el.style.objectPosition) entry.objectPosition = el.style.objectPosition;
      if (el.style.filter) entry.filter = el.style.filter;
    }
    if (isIcon(el)) {
      const image = el.querySelector('image');
      entry.src = image.getAttribute('href');
      entry.viewBox = el.getAttribute('viewBox');
      entry.imageWidth = image.getAttribute('width');
      entry.imageHeight = image.getAttribute('height');
    }
    if (el.hasAttribute('data-move') || el.hasAttribute('data-text') || isIcon(el)) {
      for (const prop of ['left','top','right','bottom','width','height','fontSize','transform']) {
        if (el.style[prop]) entry[prop] = el.style[prop];
      }
    }
    state[el.dataset.eid] = entry;
    markDirty();
  }
  function apply(saved) {
    if (!saved || typeof saved !== 'object') return;
    state = saved;
    for (const [id, item] of Object.entries(saved)) {
      const el = byId[id];
      if (!el || !item || typeof item !== 'object') continue;
      if (el.hasAttribute('data-text') && typeof item.html === 'string') el.innerHTML = item.html;
      if (isImage(el) && safeImageUrl(item.src)) {
        el.src = item.src;
        if (item.objectFit === 'contain' || /^\/api\/image\?path=/.test(item.src)) {
          el.style.objectFit = 'contain';
          el.style.objectPosition = 'center center';
        }
        if (typeof item.filter === 'string') el.style.filter = item.filter;
      }
      if (isIcon(el) && safeImageUrl(item.src)) {
        const image = el.querySelector('image');
        image.setAttribute('href', item.src);
        if (typeof item.viewBox === 'string') el.setAttribute('viewBox', item.viewBox);
        if (typeof item.imageWidth === 'string') image.setAttribute('width', item.imageWidth);
        if (typeof item.imageHeight === 'string') image.setAttribute('height', item.imageHeight);
      }
      if (el.hasAttribute('data-move') || el.hasAttribute('data-text') || isIcon(el)) {
        for (const prop of ['left','top','right','bottom','width','height','fontSize','transform']) {
          if (typeof item[prop] === 'string') el.style[prop] = item[prop];
        }
      }
    }
    positionHandles();
  }
  async function load() {
    try { apply(JSON.parse(localStorage.getItem(key) || '{}')); } catch {}
    try {
      const response = await fetch('/api/state?key=' + encodeURIComponent(key), {cache:'no-store'});
      if (response.ok && !dirty) {
        const remote = await response.json();
        if (remote.state) apply(remote.state);
      }
    } catch { setStatus('Sin conexión con el guardado remoto'); }
  }
  async function save() {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      setStatus('Guardando…');
      const response = await fetch('/api/state?key=' + encodeURIComponent(key), {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state})});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      dirty = false; setStatus('Guardado en línea');
    } catch (error) { setStatus('No se pudo guardar en línea: ' + error.message); }
  }
  async function downloadHtml() {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const button = document.getElementById('download-html');
    button.disabled = true;
    setStatus('Preparando HTML…');
    try {
      const cssResponse = await fetch('/' + model + '.css', {cache:'no-store'});
      if (!cssResponse.ok) throw new Error('No se pudo cargar el estilo');
      let css = await cssResponse.text();
      const cache = new Map();
      async function dataUrl(url) {
        if (cache.has(url)) return cache.get(url);
        const response = await fetch(url);
        if (!response.ok) throw new Error('No se pudo incluir la imagen ' + url);
        const blob = await response.blob();
        const result = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        cache.set(url, result);
        return result;
      }
      const clone = document.documentElement.cloneNode(true);
      clone.querySelector('.toolbar')?.remove();
      clone.querySelectorAll('.edit-handle,script[src="/hr3001du-editor.js"]').forEach(el => el.remove());
      for (const img of clone.querySelectorAll('img')) {
        const url = img.getAttribute('src');
        if (url && !url.startsWith('data:')) img.setAttribute('src', await dataUrl(new URL(url, location.href).href));
      }
      for (const icon of clone.querySelectorAll('svg image')) {
        const url = icon.getAttribute('href');
        if (url && !url.startsWith('data:')) icon.setAttribute('href', await dataUrl(new URL(url, location.href).href));
      }
      const cssAssets = [...new Set([...css.matchAll(/url\(['"]?(\/assets\/[^)'"]+)['"]?\)/g)].map(match => match[1]))];
      for (const asset of cssAssets) css = css.split(asset).join(await dataUrl(new URL(asset, location.href).href));
      const link = clone.querySelector('link[href="/' + model + '.css"]');
      const style = document.createElement('style');
      style.textContent = css + '\nbody{padding-top:0;background:#fff}';
      link.replaceWith(style);
      clone.querySelector('body').classList.remove('editing');
      const blob = new Blob(['<!doctype html>\n' + clone.outerHTML], {type:'text/html;charset=utf-8'});
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = model.toUpperCase() + '_hoja' + document.body.dataset.sheet.slice(1) + '.html';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      setStatus('HTML descargado');
    } catch (error) {
      setStatus('No se pudo descargar el HTML: ' + error.message);
    } finally {
      button.disabled = false;
    }
  }
  function select(el) { selected = el; positionHandles(); }
  function startDrag(event, el) {
    if (!editing || event.button !== 0 || event.target.closest('[contenteditable="true"]')) return;
    event.preventDefault();
    event.stopPropagation();
    select(el);
    const parent = el.offsetParent || page;
    const pr = parent.getBoundingClientRect(), er = el.getBoundingClientRect();
    const initialLeft = er.left - pr.left, initialTop = er.top - pr.top;
    const x = event.clientX, y = event.clientY;
    const scale = mmPerPixel();
    const relativeFairItem = relativeLayout && !['absolute','fixed'].includes(getComputedStyle(el).position);
    const prior = /translate\(([-\d.]+)mm,\s*([-\d.]+)mm\)/.exec(el.style.transform);
    const priorX = prior ? Number(prior[1]) : 0, priorY = prior ? Number(prior[2]) : 0;
    const move = e => {
      if (relativeFairItem) {
        el.style.transform = `translate(${priorX + (e.clientX - x) * scale}mm, ${priorY + (e.clientY - y) * scale}mm)`;
        positionHandles();
        return;
      }
      el.style.right = 'auto'; el.style.bottom = 'auto';
      el.style.left = ((initialLeft + e.clientX - x) * scale) + 'mm';
      el.style.top = ((initialTop + e.clientY - y) * scale) + 'mm';
      positionHandles();
    };
    const up = e => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      if (Math.abs(e.clientX-x)+Math.abs(e.clientY-y)>2) snapshot(el);
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  }
  function startResize(event, kind) {
    if (!selected) return;
    event.preventDefault(); event.stopPropagation();
    const el = selected, rect = el.getBoundingClientRect();
    const x = event.clientX, y = event.clientY, width = rect.width, height = rect.height;
    const font = parseFloat(getComputedStyle(el).fontSize);
    const move = e => {
      const horizontal = e.clientX - x, vertical = e.clientY - y;
      const delta = kind === 'size' && relativeLayout && Math.abs(vertical) > Math.abs(horizontal) ? vertical : horizontal;
      if (kind === 'width' || isGraphic(el)) {
        const next = Math.max(25, width + delta);
        el.style.width = (next * mmPerPixel()) + 'mm';
        if (isGraphic(el)) el.style.height = (next * height / width * mmPerPixel()) + 'mm';
      } else el.style.fontSize = Math.max(7, font + delta / 3) + 'px';
      positionHandles();
    };
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      snapshot(el);
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  }
  function fitEquipmentPhoto(graphic, probe) {
    const sheet = document.body.dataset.sheet;
    if (!((sheet === 'p1' && ['printer', 'machine'].includes(graphic.dataset.eid)) || (sheet === 'p2' && graphic.dataset.eid === 'machine'))) return;
    const rect = graphic.getBoundingClientRect(), pageRect = page.getBoundingClientRect();
    const scale = mmPerPixel(), aspect = probe.naturalWidth / probe.naturalHeight;
    const oldWidth = rect.width * scale, oldHeight = rect.height * scale;
    const centerX = (rect.left - pageRect.left) * scale + oldWidth / 2;
    const centerY = (rect.top - pageRect.top) * scale + oldHeight / 2;
    const maxHeight = sheet === 'p2' ? (model === 'hr3001du' ? 77 : 85) : graphic.dataset.eid === 'machine' ? 109 : 90;
    const maxWidth = Math.max(5, Math.min(190, 210 - (rect.left - pageRect.left) * scale - 8));
    const width = Math.min(maxWidth, maxHeight * aspect), height = width / aspect;
    graphic.style.width = width + 'mm'; graphic.style.height = height + 'mm';
    graphic.style.left = Math.max(0, Math.min(210 - width, centerX - width / 2)) + 'mm';
    graphic.style.top = Math.max(0, Math.min(297 - height, centerY - height / 2)) + 'mm';
    graphic.style.objectFit = 'contain'; graphic.style.objectPosition = 'center center';
  }
  function upload(graphic) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml';
    input.onchange = async () => {
      const file = input.files && input.files[0]; if (!file) return;
      const icon = isIcon(graphic);
      const image = icon ? graphic.querySelector('image') : null;
      const previous = icon
        ? {src:image.getAttribute('href'),viewBox:graphic.getAttribute('viewBox'),width:image.getAttribute('width'),height:image.getAttribute('height')}
        : {src:graphic.src, style:graphic.getAttribute('style')};
      const preview = URL.createObjectURL(file);
      setStatus('Subiendo imagen…');
      try {
        if (icon) {
          const probe = new Image();
          probe.src = preview;
          await probe.decode();
          graphic.setAttribute('viewBox', '0 0 ' + probe.naturalWidth + ' ' + probe.naturalHeight);
          image.setAttribute('width', String(probe.naturalWidth));
          image.setAttribute('height', String(probe.naturalHeight));
          image.setAttribute('href', preview);
        } else {
          const probe = new Image();
          probe.src = preview;
          await probe.decode();
          fitEquipmentPhoto(graphic, probe);
          graphic.style.objectFit = 'contain';
          graphic.style.objectPosition = 'center center';
          if (model === 'feria-hr3002dt') graphic.style.filter = 'none';
          graphic.src = preview;
        }
        positionHandles();
        const response = await fetch('/api/image?key=' + encodeURIComponent(key + '_' + graphic.dataset.eid), {method:'PUT',headers:{'Content-Type':file.type},body:file});
        const result = await response.json();
        if (!response.ok || !result.url) throw new Error(result.error || 'Error de subida');
        if (icon) image.setAttribute('href', result.url);
        else graphic.src = result.url;
        snapshot(graphic);
        await save();
      } catch (error) {
        if (icon) {
          graphic.setAttribute('viewBox', previous.viewBox);
          image.setAttribute('width', previous.width);
          image.setAttribute('height', previous.height);
          image.setAttribute('href', previous.src);
        } else {
          graphic.src = previous.src;
          if (previous.style === null) graphic.removeAttribute('style');
          else graphic.setAttribute('style', previous.style);
        }
        setStatus('No se pudo subir la imagen: ' + error.message);
      }
      finally { URL.revokeObjectURL(preview); positionHandles(); }
    };
    input.click();
  }
  elements.forEach(el => {
    if (isIcon(el)) el.addEventListener('pointerdown', event => event.stopPropagation());
    if (el.hasAttribute('data-move')) el.addEventListener('pointerdown', e => startDrag(e, el));
    if (el.hasAttribute('data-text')) {
      el.addEventListener('dblclick', () => {
        if (!editing) return;
        select(el); el.contentEditable = 'true'; el.focus();
      });
      el.addEventListener('blur', () => {
        if (el.contentEditable === 'true') { el.contentEditable = 'false'; snapshot(el); }
      });
    } else if (isGraphic(el)) el.addEventListener('dblclick', () => { select(el); upload(el); });
    el.addEventListener('click', e => { if (editing) { e.stopPropagation(); select(el); } });
  });
  blue.addEventListener('pointerdown', e => startResize(e, 'width'));
  orange.addEventListener('pointerdown', e => startResize(e, 'size'));
  page.addEventListener('pointerdown', e => { if (e.target === page) { selected = null; positionHandles(); } });
  toggle.onclick = () => {
    editing = !editing; document.body.classList.toggle('editing', editing);
    toggle.textContent = editing ? 'Desactivar edición' : 'Activar edición';
    if (!editing) selected = null;
    positionHandles();
  };
  saveButton.onclick = save;
  document.getElementById('download-html').onclick = downloadHtml;
  if (new URLSearchParams(location.search).has('print')) document.documentElement.classList.add('print-mode');
  load();
})();
