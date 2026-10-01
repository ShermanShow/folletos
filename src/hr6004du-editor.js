(() => {
  const page = document.querySelector('.page');
  if (!page) return;
  const key = 'huenu_editor_state_hr6004du_v1_' + document.body.dataset.sheet;
  const status = document.getElementById('edit-status');
  const toggle = document.getElementById('edit-toggle');
  const saveButton = document.getElementById('save');
  page.querySelectorAll('svg.icon-crop').forEach((icon, index) => {
    if (!icon.dataset.eid) icon.dataset.eid = 'icon-' + (index + 1);
  });
  const elements = [...page.querySelectorAll('[data-eid]')];
  const byId = Object.fromEntries(elements.map(el => [el.dataset.eid, el]));
  let editing = false, selected = null, dirty = false, state = {};
  let revision = 0, saveTimer = null, saveQueue = Promise.resolve(), retryDelay = 5000;
  let initialLoad = Promise.resolve();
  const mmPerPixel = () => 210 / page.getBoundingClientRect().width;
  const setStatus = (message, error = false) => {
    if (status) {
      status.textContent = message;
      status.style.color = error ? '#ffb4aa' : '#adf9b4';
    }
  };
  const blue = document.createElement('i'), orange = document.createElement('i');
  blue.className = 'edit-handle blue'; orange.className = 'edit-handle orange';
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
  function scheduleSave(delay = 700) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { save().catch(() => {}); }, delay);
  }
  function markDirty() {
    dirty = true;
    revision++;
    setStatus('Cambios sin guardar');
    positionHandles();
    scheduleSave();
  }
  function snapshot(el) {
    const entry = state[el.dataset.eid] || {};
    if (el.hasAttribute('data-text')) entry.html = el.innerHTML;
    if (isImage(el)) {
      entry.src = el.getAttribute('src');
      if (el.style.objectFit) entry.objectFit = el.style.objectFit;
      if (el.style.objectPosition) entry.objectPosition = el.style.objectPosition;
    }
    if (isIcon(el)) {
      const image = el.querySelector('image');
      entry.src = image.getAttribute('href');
      entry.viewBox = el.getAttribute('viewBox');
      entry.imageWidth = image.getAttribute('width');
      entry.imageHeight = image.getAttribute('height');
    }
    if (el.hasAttribute('data-move') || el.hasAttribute('data-text') || isIcon(el)) {
      for (const prop of ['left','top','right','bottom','width','height','fontSize']) {
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
      if (isImage(el)) {
        if (safeImageUrl(item.src)) el.src = item.src;
        if (item.objectFit === 'contain' || /^\/api\/image\?path=/.test(item.src || '')) {
          el.style.objectFit = 'contain';
          el.style.objectPosition = 'center center';
        }
      }
      if (isIcon(el) && safeImageUrl(item.src)) {
        const image = el.querySelector('image');
        image.setAttribute('href', item.src);
        if (typeof item.viewBox === 'string') el.setAttribute('viewBox', item.viewBox);
        if (typeof item.imageWidth === 'string') image.setAttribute('width', item.imageWidth);
        if (typeof item.imageHeight === 'string') image.setAttribute('height', item.imageHeight);
      }
      if (el.hasAttribute('data-move') || el.hasAttribute('data-text') || isIcon(el)) {
        for (const prop of ['left','top','right','bottom','width','height','fontSize']) {
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
    await initialLoad;
    clearTimeout(saveTimer);
    const version = revision;
    const payload = JSON.stringify({state});
    let localCopyFailed = false;
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { localCopyFailed = true; }
    setStatus('Guardando…');
    saveQueue = saveQueue.catch(() => {}).then(async () => {
      const response = await fetch('/api/state?key=' + encodeURIComponent(key), {method:'PUT',headers:{'Content-Type':'application/json'},body:payload});
      if (!response.ok) throw new Error('HTTP ' + response.status);
    });
    try {
      await saveQueue;
      if (version === revision) {
        dirty = false;
        retryDelay = 5000;
        setStatus(localCopyFailed ? 'Guardado en línea (sin copia local)' : 'Guardado en línea');
      }
    } catch (error) {
      dirty = true;
      setStatus('No se pudo guardar en línea: ' + error.message, true);
      scheduleSave(retryDelay);
      retryDelay = Math.min(retryDelay * 2, 30000);
      throw error;
    }
  }
  async function downloadHtml() {
    await initialLoad;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const button = document.getElementById('download-html');
    button.disabled = true;
    setStatus('Preparando HTML…');
    try {
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
      clone.querySelectorAll('.edit-handle,script[src="/hr6004du-editor.js"],style#hr6004du-editor-layout').forEach(el => el.remove());
      for (const img of clone.querySelectorAll('img')) {
        const url = img.getAttribute('src');
        if (url && !url.startsWith('data:')) img.setAttribute('src', await dataUrl(new URL(url, location.href).href));
      }
      for (const icon of clone.querySelectorAll('svg image')) {
        const url = icon.getAttribute('href');
        if (url && !url.startsWith('data:')) icon.setAttribute('href', await dataUrl(new URL(url, location.href).href));
      }
      clone.querySelector('body').classList.remove('editing');
      const blob = new Blob(['<!doctype html>\n' + clone.outerHTML], {type:'text/html;charset=utf-8'});
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = 'HR6004DU_hoja' + document.body.dataset.sheet.slice(1) + '.html';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      setStatus(dirty ? 'HTML descargado; hay cambios sin guardar en línea' : 'HTML descargado', dirty);
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
    const move = e => {
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
    const x = event.clientX, width = rect.width, height = rect.height;
    const font = parseFloat(getComputedStyle(el).fontSize);
    const move = e => {
      const delta = e.clientX - x;
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
  async function prepareImage(file) {
    if (file.size <= 3800000) return file;
    if (file.type === 'image/gif') throw new Error('El GIF supera 3,8 MB; usá una versión más liviana');
    setStatus('Optimizando imagen grande…');
    const bitmap = await createImageBitmap(file);
    try {
      let maxSide = 2600;
      for (let attempt = 0; attempt < 5; attempt++) {
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const result = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.88 - attempt * 0.08));
        if (result && result.size <= 3800000) return result;
        maxSide *= 0.8;
      }
      throw new Error('La imagen sigue siendo demasiado grande para guardar');
    } finally {
      bitmap.close?.();
    }
  }
  function fitEquipmentPhoto(graphic, probe) {
    const sheet = document.body.dataset.sheet;
    if (!((sheet === 'p1' && graphic.dataset.eid === 'printer') || (sheet === 'p2' && graphic.dataset.eid === 'machine'))) return;
    const rect = graphic.getBoundingClientRect(), pageRect = page.getBoundingClientRect();
    const scale = mmPerPixel(), aspect = probe.naturalWidth / probe.naturalHeight;
    const oldWidth = rect.width * scale, oldHeight = rect.height * scale;
    const centerX = (rect.left - pageRect.left) * scale + oldWidth / 2;
    const centerY = (rect.top - pageRect.top) * scale + oldHeight / 2;
    const maxWidth = Math.max(5, Math.min(190, 210 - (rect.left - pageRect.left) * scale - 8));
    const width = Math.min(maxWidth, (sheet === 'p2' ? 77 : 90) * aspect), height = width / aspect;
    graphic.style.width = width + 'mm'; graphic.style.height = height + 'mm';
    graphic.style.left = Math.max(0, Math.min(210 - width, centerX - width / 2)) + 'mm';
    graphic.style.top = Math.max(0, Math.min(297 - height, centerY - height / 2)) + 'mm';
  }
  function upload(graphic) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp,image/gif';
    input.onchange = async () => {
      await initialLoad;
      const selectedFile = input.files && input.files[0]; if (!selectedFile) return;
      let file;
      try { file = await prepareImage(selectedFile); }
      catch (error) { setStatus('No se pudo preparar la imagen: ' + error.message, true); return; }
      const icon = isIcon(graphic);
      const image = icon ? graphic.querySelector('image') : null;
      const previous = icon
        ? {src:image.getAttribute('href'),viewBox:graphic.getAttribute('viewBox'),width:image.getAttribute('width'),height:image.getAttribute('height')}
        : {src:graphic.src, style:graphic.getAttribute('style')};
      const preview = URL.createObjectURL(file);
      let uploaded = false;
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
          graphic.src = preview;
          graphic.style.objectFit = 'contain';
          graphic.style.objectPosition = 'center center';
        }
        positionHandles();
        const response = await fetch('/api/image?key=' + encodeURIComponent(key + '_' + graphic.dataset.eid), {method:'PUT',headers:{'Content-Type':file.type},body:file});
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.url) throw new Error(result.error || 'Error de subida (HTTP ' + response.status + ')');
        uploaded = true;
        if (icon) image.setAttribute('href', result.url);
        else graphic.src = result.url;
        snapshot(graphic);
        await save();
      } catch (error) {
        if (uploaded) {
          setStatus('Imagen subida, pero aún sin guardar: ' + error.message, true);
        } else if (icon) {
          graphic.setAttribute('viewBox', previous.viewBox);
          image.setAttribute('width', previous.width);
          image.setAttribute('height', previous.height);
          image.setAttribute('href', previous.src);
        } else {
          graphic.src = previous.src;
          if (previous.style === null) graphic.removeAttribute('style');
          else graphic.setAttribute('style', previous.style);
          setStatus('No se pudo subir la imagen: ' + error.message, true);
        }
        if (!uploaded && icon) setStatus('No se pudo subir la imagen: ' + error.message, true);
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
  toggle.onclick = async () => {
    await initialLoad;
    editing = !editing; document.body.classList.toggle('editing', editing);
    toggle.textContent = editing ? 'Desactivar edición' : 'Activar edición';
    if (!editing) selected = null;
    positionHandles();
  };
  saveButton.onclick = () => { save().catch(() => {}); };
  document.getElementById('download-html').onclick = downloadHtml;
  window.addEventListener('beforeunload', event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });
  if (new URLSearchParams(location.search).has('print')) document.documentElement.classList.add('print-mode');
  initialLoad = load();
})();
