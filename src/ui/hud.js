// HUD 2D: helpers de HTML y las ventanas de formulario (agregar deseo, ahorro, demo).
import { MODELOS, COLORES } from '../models/index.js';
import { CATEGORIAS, PRIORIDADES, dinero } from '../data/rules.js';
import { PROVEEDORES, getLlave, setLlave, olvidarLlave, llaveRecordada, crearConIA, aDeseo, EJEMPLO } from '../ai/souvenir-ai.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function setHud(hud, html) { hud.innerHTML = html; return hud; }

function openModal(hud, html, onSubmit) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = html;
  hud.appendChild(back);
  const form = back.querySelector('form');
  const err = back.querySelector('.error');
  const close = () => back.remove();
  back.addEventListener('pointerdown', (e) => { if (e.target === back) close(); });
  back.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await onSubmit(new FormData(form), close, back); }
    catch (ex) { if (err) err.textContent = ex.message; }
  });
  back.querySelector('input, select, button')?.focus();
  return { back, close };
}

/** Formulario: agregar un deseo (o editar uno si llega `initial`). */
export function modalDeseo(hud, onSave, initial = null, { onIA } = {}) {
  const v = initial || {};
  const opt = (arr, sel) => arr.map((x) => `<option${x === sel ? ' selected' : ''}>${esc(x)}</option>`).join('');
  const modelos = Object.entries(MODELOS)
    .filter(([k, m]) => !m.hidden || k === v.modelo)
    .map(([k, m]) => `<option value="${k}"${k === v.modelo ? ' selected' : ''}>${esc(m.label)}</option>`).join('');
  const sw = [...COLORES];
  if (v.color && !sw.some((c) => c.hex.toLowerCase() === v.color.toLowerCase())) sw.unshift({ id: 'actual', label: 'Color actual', hex: v.color });
  const checked = (c, i) => (v.color ? c.hex.toLowerCase() === v.color.toLowerCase() : i === 0);
  const colores = sw.map((c, i) => `<label class="swatch" title="${esc(c.label)}"><input type="radio" name="color" value="${esc(c.hex)}"${checked(c, i) ? ' checked' : ''} aria-label="${esc(c.label)}"><span style="background:${esc(c.hex)}"></span></label>`).join('');
  const editing = !!initial;
  const m = openModal(hud, `
    <form class="modal" id="form-deseo" novalidate>
      <div class="modal-head"><h2>${editing ? 'EDITAR DESEO' : 'NUEVO DESEO'}</h2>${!editing && onIA ? '<button type="button" class="btn outline small" id="to-ia">✦ CREAR CON IA</button>' : ''}</div>
      <div class="field"><label for="d-nombre">Nombre</label><input id="d-nombre" name="nombre" type="text" maxlength="60" placeholder="iPhone 16, Sony a7 IV…" value="${esc(v.nombre || '')}" required></div>
      <div class="row2">
        <div class="field"><label for="d-precio">Precio (USD)</label><input id="d-precio" name="precio" type="number" min="1" step="0.01" placeholder="799" value="${v.precio ?? ''}" required></div>
        <div class="field"><label for="d-prioridad">Prioridad</label><select id="d-prioridad" name="prioridad">${opt(PRIORIDADES, v.prioridad || 'Media')}</select></div>
      </div>
      <div class="row2">
        <div class="field"><label for="d-categoria">Categoría</label><select id="d-categoria" name="categoria">${opt(CATEGORIAS, v.categoria || 'Tecnología')}</select></div>
        <div class="field"><label for="d-modelo">Objeto del globo</label><select id="d-modelo" name="modelo">${modelos}</select></div>
      </div>
      <fieldset class="swatches"><legend>Color</legend>${colores}</fieldset>
      <p class="note">${editing ? 'Los días en vitrina no cambian al editar.' : 'Llega escarchado: no se puede comprar hasta cumplir 7 días en la vitrina.'}</p>
      <p class="error" role="alert"></p>
      <div class="actions"><button type="button" class="btn ghost small" data-close>CANCELAR</button><button type="submit" class="btn small">${editing ? 'GUARDAR' : 'PONER EN LA VITRINA'}</button></div>
    </form>`, async (fd, close) => {
    const nombre = String(fd.get('nombre') || '').trim();
    const precio = Number(fd.get('precio'));
    if (!nombre) throw new Error('Ponle un nombre al deseo.');
    if (!(precio > 0)) throw new Error('El precio tiene que ser mayor que cero.');
    await onSave({ nombre, precio, categoria: fd.get('categoria'), prioridad: fd.get('prioridad'), modelo: fd.get('modelo'), color: fd.get('color') });
    close();
  });
  m.back.querySelector('#to-ia')?.addEventListener('click', () => { m.close(); onIA(); });
  return m;
}

/** Formulario: crear un souvenir con la IA usando tu propia llave. */
export function modalIA(hud, onCreate) {
  const saved = getLlave();
  const prov = saved?.provider || 'anthropic';
  const provOpts = Object.entries(PROVEEDORES).map(([k, p]) => `<option value="${k}"${k === prov ? ' selected' : ''}>${esc(p.label)}</option>`).join('');
  const m = openModal(hud, `
    <form class="modal" id="form-ia" novalidate autocomplete="off">
      <h2>✦ CREAR CON IA</h2>
      <div class="field"><label for="ia-texto">Describe tu deseo</label><textarea id="ia-texto" name="texto" rows="3" maxlength="400" placeholder="Una guitarra eléctrica roja de unos $700"></textarea></div>
      <div class="row2">
        <div class="field"><label for="ia-prov">Proveedor</label><select id="ia-prov" name="provider">${provOpts}</select></div>
        <div class="field"><label for="ia-model">Modelo</label><input id="ia-model" name="model" type="text" value="${esc(saved?.model || PROVEEDORES[prov].model)}" spellcheck="false"></div>
      </div>
      <div class="field"><label for="ia-key">Tu llave de API</label><input id="ia-key" name="key" type="password" placeholder="${esc(PROVEEDORES[prov].keyHint)}" value="${esc(saved?.key || '')}" spellcheck="false" autocomplete="off"></div>
      <label class="check"><input type="checkbox" name="recordar" id="ia-recordar"${llaveRecordada() ? ' checked' : ''}> Recordar la llave en este navegador</label>
      <p class="note"></p>
      <p class="status" aria-live="polite"></p>
      <p class="error" role="alert"></p>
      <div class="actions">
        <button type="button" class="btn ghost small" data-close>CANCELAR</button>
        <button type="button" class="btn ghost small" id="ia-ejemplo">VER UN EJEMPLO</button>
        <button type="submit" class="btn small" id="ia-go">CREAR SOUVENIR</button>
      </div>
      ${saved ? '<button type="button" class="link" id="ia-olvidar" style="align-self:flex-start;font-size:22px">Olvidar mi llave</button>' : ''}
    </form>`, async (fd, close, back) => {
    const cfg = { provider: fd.get('provider'), model: String(fd.get('model') || '').trim(), key: String(fd.get('key') || '').trim() };
    const status = back.querySelector('.status'), go = back.querySelector('#ia-go');
    back.querySelector('.error').textContent = '';
    status.textContent = 'La IA está armando tu souvenir…';
    go.disabled = true;
    try {
      setLlave(cfg, fd.get('recordar') === 'on');
      const deseo = await crearConIA(cfg, String(fd.get('texto') || ''));
      await onCreate(deseo);
      close();
    } finally { status.textContent = ''; go.disabled = false; }
  });
  const q = (sel) => m.back.querySelector(sel);
  const note = q('.note');
  const setNote = () => { note.textContent = `La llave va directo de tu navegador a ${PROVEEDORES[q('#ia-prov').value].label}. No pasa por ningún servidor de la tienda y tu wishlist se queda en este navegador.`; };
  setNote();
  q('#ia-prov').addEventListener('change', () => {
    const p = PROVEEDORES[q('#ia-prov').value];
    if (Object.values(PROVEEDORES).some((x) => x.model === q('#ia-model').value)) q('#ia-model').value = p.model;
    q('#ia-key').placeholder = p.keyHint;
    setNote();
  });
  q('#ia-ejemplo').addEventListener('click', async () => { await onCreate(aDeseo(EJEMPLO)); m.close(); });
  q('#ia-olvidar')?.addEventListener('click', (e) => { olvidarLlave(); q('#ia-key').value = ''; q('#ia-recordar').checked = false; e.currentTarget.remove(); });
  q('#ia-texto').focus();
  return m;
}

/** Formulario: actualizar el ahorro de la quincena. */
export function modalAhorro(hud, actual, onSave) {
  return openModal(hud, `
    <form class="modal" id="form-ahorro" novalidate>
      <h2>AHORRO DE LA QUINCENA</h2>
      <div class="field"><label for="a-monto">Ahorro actual (USD)</label><input id="a-monto" name="monto" type="number" min="0" step="0.01" value="${actual}"></div>
      <p class="note">La tienda solo registra: el dinero se mueve afuera, con tus sobres.</p>
      <p class="error" role="alert"></p>
      <div class="actions"><button type="button" class="btn ghost small" data-close>CANCELAR</button><button type="submit" class="btn small">GUARDAR</button></div>
    </form>`, async (fd, close) => {
    const monto = Number(fd.get('monto'));
    if (!(monto >= 0)) throw new Error('Escribe un monto válido.');
    await onSave(monto);
    close();
  });
}

/** Ventana de la demo: adelantar el reloj o empezar de cero. */
export function modalDemo(hud, { demoDias }, { onAdvance, onReset }) {
  const m = openModal(hud, `
    <form class="modal" id="form-demo">
      <h2>MODO DEMO</h2>
      <p class="note">Estos datos viven solo en este navegador. Reloj de la demo: ${demoDias ? `+${demoDias} días` : 'hoy'}.</p>
      <button type="button" class="btn outline" id="demo-7">ADELANTAR 7 DÍAS</button>
      <button type="button" class="btn ghost" id="demo-reset">EMPEZAR DE CERO</button>
      <p class="error" role="alert"></p>
      <div class="actions"><button type="button" class="btn ghost small" data-close>CERRAR</button></div>
    </form>`, async () => {});
  m.back.querySelector('#demo-7').addEventListener('click', async () => { await onAdvance(7); m.close(); });
  const reset = m.back.querySelector('#demo-reset');
  reset.addEventListener('click', async () => {
    if (reset.dataset.armed) { await onReset(); m.close(); return; }
    reset.dataset.armed = '1';
    reset.textContent = '¿SEGURO? TOCA OTRA VEZ';
  });
  return m;
}

export const fmt = { dinero };
