// 2 · Vitrina: dos estantes (arriba lo de $1,000 o más, abajo lo demás). Cada deseo es un globo de nieve.
import { T, M, B, box, put, cyl, tex, fit, FONT_TITLE, FONT_TEXT, COLORS as C } from '../engine/lib.js';
import { globeFor } from '../models/index.js';
import { dias, escarchado, diasParaDescongelar, nieve, estante, dinero } from '../data/rules.js';
import { setHud, esc, modalDeseo, modalIA, modalAhorro, modalAcceso, modalDemo } from '../ui/hud.js';

const SP = 2.0;          // separación entre globos
const TOP = 1.7;         // superficie del estante de arriba
const BOT = -0.1;        // superficie del mostrador
const GZ = -0.3;         // profundidad de los globos

export async function vitrina(ctx, params = {}) {
  const { store } = ctx;
  const state = await store.get();
  const now = store.now();
  const remoto = state.acceso?.configurado === true;
  const personal = state.vitrinaPersonal === true;
  const dueno = !remoto || state.acceso.dueno || personal;

  const s = new T.Scene();
  s.background = new T.Color(0x161c42);
  const cam = new T.PerspectiveCamera(45, 4 / 3, 0.1, 60);
  const W1 = M(C.wood), W2 = M(C.woodMid), W3 = M(C.woodDark);

  const byDate = (a, b) => new Date(a.creado) - new Date(b.creado);
  const arriba = state.deseos.filter((d) => estante(d) === 'arriba').sort(byDate);
  const abajo = state.deseos.filter((d) => estante(d) === 'abajo').sort(byDate);
  const n = Math.max(arriba.length, abajo.length, 2);
  const L = n * SP + 2.4;

  // Pared, estante de arriba con ménsulas y mostrador con gavetas
  const wallW = L + 10;
  for (let i = 0; i < Math.ceil(wallW / 0.5); i++) box(s, 0.5, 6, 0.08, M(i % 2 ? 0x2a1f3d : 0x30244a), -wallW / 2 + i * 0.5, 1.4, -1.25);
  box(s, wallW, 0.12, 0.12, W3, 0, 0.62, -1.18);
  box(s, L, 0.1, 1.2, W1, 0, TOP - 0.05, -0.62);
  box(s, L, 0.04, 1.22, W3, 0, TOP - 0.12, -0.62);
  for (let x = -L / 2 + 0.3; x <= L / 2; x += SP) box(s, 0.08, 0.36, 0.7, W3, x, TOP - 0.3, -0.85);
  box(s, L + 0.6, 0.12, 1.7, W1, 0, BOT - 0.06, -0.35);
  box(s, L + 0.62, 0.04, 1.72, W3, 0, BOT - 0.14, -0.35);
  box(s, L + 0.5, 1.6, 1.5, W2, 0, BOT - 0.95, -0.4);
  for (let x = -L / 2 + SP / 2; x < L / 2; x += SP) {
    box(s, SP - 0.3, 0.55, 0.04, W1, x, BOT - 0.55, 0.36);
    box(s, 0.24, 0.06, 0.06, M(C.amber, { shininess: 40 }), x, BOT - 0.55, 0.4);
  }

  // Guirnalda con focos sobre el estante de arriba
  const bulbColors = [C.red, C.amber, 0x3e8e5a, 0x4a78e8];
  const bulbs = [];
  for (let x = -L / 2 - 1, i = 0; x < L / 2 + 1; x += 0.3, i++) {
    const y = 3.15 - Math.abs(Math.sin(i * 0.55)) * 0.16;
    box(s, 0.3, 0.04, 0.04, M(C.pine), x, y + 0.06, -1.1);
    bulbs.push(box(s, 0.07, 0.09, 0.07, B(bulbColors[i % 4]), x, y, -1.05));
  }
  // Pinos y velas en los extremos del estante de arriba
  [-L / 2 + 0.35, L / 2 - 0.35].forEach((x, i) => {
    put(s, new T.Mesh(new T.ConeGeometry(0.16, 0.4, 6), M(C.pine)), x, TOP + 0.2, -0.75);
    box(s, 0.09, 0.22, 0.09, M(0xefe6d2), x + (i ? -0.3 : 0.3), TOP + 0.11, -0.9);
  });
  const flames = [-L / 2 + 0.65, L / 2 - 0.65].map((x) => box(s, 0.05, 0.08, 0.05, B(C.amber), x, TOP + 0.27, -0.9));

  // Letreros de cada estante
  const sign = (txt, x, y, z) => {
    const t = tex(72, 20, (c, w) => {
      c.fillStyle = '#C7832E'; c.fillRect(0, 0, w, 20);
      c.fillStyle = '#1B1B22'; fit(c, txt, FONT_TITLE, 8, w - 8); c.fillText(txt, 4, 6);
    });
    put(s, new T.Mesh(new T.PlaneGeometry(0.9, 0.25), new T.MeshBasicMaterial({ map: t })), x, y, z);
  };
  sign('+$1,000', -L / 2 + 0.55, TOP - 0.05, 0.0);
  sign('-$1,000', -L / 2 + 0.25, BOT - 0.06, 0.53);

  // Globos
  const slots = [];
  const place = (list, y) => list.forEach((d, i) => {
    const x = (i - (list.length - 1) / 2) * SP;
    const frost = escarchado(d, now);
    const gl = globeFor(d, { pile: nieve(d, now), frost });
    gl.g.position.set(x, y, GZ);
    gl.g.userData.idx = slots.length;
    s.add(gl.g);
    // Etiqueta de precio al frente de la tabla
    const label = tex(96, 26, (c, w, h) => {
      c.fillStyle = frost ? '#DCE6FF' : '#EFE6D2'; c.fillRect(0, 0, w, h);
      c.fillStyle = frost ? '#7FB2FF' : '#C7832E'; c.fillRect(0, 0, w, 2);
      c.fillStyle = '#1B1B22';
      const name = d.nombre.toUpperCase();
      fit(c, name, FONT_TITLE, 8, w - 8); c.fillText(name, 4, 4);
      c.fillStyle = frost ? '#2F5BD3' : '#3B3A40';
      const l2 = frost ? `Escarchado · ${diasParaDescongelar(d, now)} d` : `${dinero(d.precio)} · ${dias(d.creado, now)} días`;
      fit(c, l2, FONT_TEXT, 14, w - 8); c.fillText(l2, 4, 13);
    });
    const front = y === TOP ? 0.0 : 0.53;
    put(s, new T.Mesh(new T.PlaneGeometry(1.25, 0.34), new T.MeshBasicMaterial({ map: label })), x, y - 0.14, front);
    slots.push({ d, gl, x, y, frost });
  });
  place(arriba, TOP);
  place(abajo, BOT);

  // Nota de estante vacío
  const emptyNote = (y, z) => {
    const t = tex(110, 30, (c, w, h) => { c.fillStyle = '#EFE6D2'; c.fillRect(0, 0, w, h); c.fillStyle = '#6E6658'; fit(c, 'Estante vacío', FONT_TEXT, 18, w - 10); c.fillText('Estante vacío', 6, 7); });
    const p = put(s, new T.Mesh(new T.PlaneGeometry(1.1, 0.3), new T.MeshLambertMaterial({ map: t })), 0, y + 0.01, z);
    p.rotation.x = -Math.PI / 2 + 0.3;
  };
  if (!arriba.length) emptyNote(TOP, -0.4);
  if (!abajo.length) emptyNote(BOT, -0.1);

  // Halo y luz del seleccionado
  const halo = put(s, new T.Mesh(new T.CircleGeometry(0.62, 16), new T.MeshBasicMaterial({ color: C.amber, transparent: true, opacity: 0.18 })), 0, 0, GZ);
  halo.rotation.x = -Math.PI / 2;
  const spot = new T.PointLight(0xffd9a0, 1.0, 3.5);
  s.add(spot);

  s.add(new T.AmbientLight(0x6a76b8, 0.55));
  const warm = new T.PointLight(C.amber, 1.1, 10); warm.position.set(0, 2.6, 2.4); s.add(warm);
  const key = new T.DirectionalLight(0xc9d2ff, 0.45); key.position.set(-2, 3, 4); s.add(key);

  let sel = Math.max(0, slots.findIndex((x) => x.d.id === params.sel));
  const xs = slots.map((x) => x.x);
  const minX = Math.min(0, ...xs), maxX = Math.max(0, ...xs);
  let camX = slots[sel] ? Math.max(minX, Math.min(maxX, slots[sel].x)) : 0;

  const select = (i) => {
    if (!slots.length) return;
    sel = (i + slots.length) % slots.length;
    slots.forEach((x, k) => x.gl.setSelected(k === sel));
  };
  select(sel);

  // Cambiar de estante: el globo más cercano en x del otro estante
  const switchShelf = () => {
    const cur = slots[sel]; if (!cur) return;
    const other = slots.map((x, i) => ({ x, i })).filter((o) => o.x.y !== cur.y);
    if (!other.length) return;
    other.sort((a, b) => Math.abs(a.x.x - cur.x) - Math.abs(b.x.x - cur.x));
    select(other[0].i);
  };

  const open = () => { const cur = slots[sel]; if (cur) ctx.go('globo', { id: cur.d.id }); };

  // HUD
  const escarchados = slots.filter((x) => x.frost).length;
  setHud(ctx.hud, `
    <header class="bar-top">
      <p class="brand">SOUVENIRS DEL SOLSTICIO</p>
      <div style="display:flex;align-items:center;gap:6px">
        ${dueno ? `<button type="button" class="key" id="ahorro" title="Actualizar ahorro">${personal ? 'AHORRO LOCAL' : 'AHORRO'} <span>${esc(dinero(state.ahorro.monto))}</span></button>` : '<p class="stat">VITRINA PÚBLICA</p>'}
        <p class="stat">· ${slots.length} EN VITRINA${escarchados ? ` · ${escarchados} ESCARCHADO${escarchados > 1 ? 'S' : ''}` : ''}</p>
        ${dueno ? '<button type="button" class="key" id="demo" title="Opciones de la demo">DEMO ▾</button>' : ''}
        ${personal ? '<button type="button" class="key" id="publica">VER PÚBLICA</button>' : ''}
        ${remoto && !personal && !state.acceso.dueno && state.vitrinaPersonalCantidad ? `<button type="button" class="key" id="personal">MI VITRINA (${state.vitrinaPersonalCantidad})</button>` : ''}
        ${remoto ? `<button type="button" class="key" id="${state.acceso.autenticado ? 'logout' : 'login'}">${state.acceso.autenticado ? 'SALIR' : 'ENTRAR'}</button>` : ''}
      </div>
    </header>
    ${slots.length ? '' : `<p class="empty passive">${dueno ? 'La vitrina está vacía. Agrega tu primer deseo con + DESEO.' : 'La vitrina pública todavía está vacía.'}</p>`}
    <nav class="bar-bottom" aria-label="Controles de la vitrina">
      <button type="button" class="key" id="prev" aria-label="Globo anterior">◄</button>
      <button type="button" class="key" id="next" aria-label="Globo siguiente">►</button>
      <button type="button" class="key" id="shelf"><span>▲▼</span> ESTANTE</button>
      <button type="button" class="key" id="grab"><span>A</span> AGARRAR</button>
      <button type="button" class="key" id="book"><span>B</span> LIBRETA</button>
      ${dueno ? '<button type="button" class="key" id="add"><span>+</span> DESEO</button>' : ''}
      ${dueno || remoto ? '<button type="button" class="key" id="ai"><span>✦</span> IA</button>' : ''}
    </nav>`);
  const $ = (id) => ctx.hud.querySelector('#' + id);
  const addAndShow = async (d) => {
    const nd = remoto && !dueno ? await store.addDeseoLocal(d) : await store.addDeseo(d);
    ctx.go('vitrina', { sel: nd.id });
  };
  const openIA = () => modalIA(ctx.hud, addAndShow);
  const openDeseo = () => modalDeseo(ctx.hud, addAndShow, null, { onIA: openIA });
  const openAhorro = () => modalAhorro(ctx.hud, state.ahorro.monto, async (m) => { await store.setAhorro(m); ctx.go('vitrina', { sel: slots[sel]?.d.id }); });
  $('prev').onclick = () => select(sel - 1);
  $('next').onclick = () => select(sel + 1);
  $('shelf').onclick = switchShelf;
  $('grab').onclick = open;
  $('book').onclick = () => ctx.go('libreta');
  if (dueno) {
    $('add').onclick = openDeseo;
    $('ahorro').onclick = openAhorro;
    $('demo').onclick = () => modalDemo(ctx.hud, state, {
      onAdvance: async (k) => { await store.adelantar(k); ctx.go('vitrina', { sel: slots[sel]?.d.id }); },
      onReset: async () => { await store.reiniciar(); ctx.go('vitrina'); },
    });
  }
  if ($('ai')) $('ai').onclick = openIA;
  if ($('personal')) $('personal').onclick = async () => { await store.usarVitrinaPersonal(); ctx.go('vitrina'); };
  if ($('publica')) $('publica').onclick = async () => { await store.usarVitrinaPublica(); ctx.go('vitrina'); };
  if ($('login')) $('login').onclick = () => modalAcceso(ctx.hud, store);
  if ($('logout')) $('logout').onclick = async () => { await store.logout(); ctx.go('vitrina', {}, { history: 'replace' }); };

  const ray = new T.Raycaster();
  const roots = slots.map((x) => x.gl.g);

  return {
    scene: s,
    camera: cam,
    update(t) {
      const cur = slots[sel];
      const target = cur ? Math.max(minX, Math.min(maxX, cur.x)) : 0;
      camX += (target - camX) * 0.08;
      cam.position.set(camX + Math.sin(t * 0.3) * 0.2, 1.6, 5.6);
      cam.lookAt(camX, 1.35, 0);
      slots.forEach((x, k) => { x.gl.tick(); x.gl.g.position.y = x.y + (k === sel ? Math.abs(Math.sin(t * 2)) * 0.06 : 0); });
      if (cur) {
        cur.gl.holder.rotation.y += 0.004;
        halo.position.set(cur.x, cur.y + 0.01, GZ);
        halo.material.opacity = 0.14 + Math.sin(t * 3) * 0.05;
        spot.position.set(cur.x, cur.y + 1.6, 0.8);
      }
      halo.visible = !!cur;
      flames.forEach((f, i) => { f.scale.y = 0.8 + Math.sin(t * 9 + i) * 0.25; });
      bulbs.forEach((b, i) => { b.visible = ((Math.floor(t * 2) + i) % 5) !== 0; });
    },
    onPointer(type, p) {
      if (type !== 'tap') return;
      ray.setFromCamera(p, cam);
      const hit = ray.intersectObjects(roots, true)[0];
      if (!hit) return;
      let o = hit.object;
      while (o && o.userData.idx === undefined) o = o.parent;
      if (!o) return;
      if (o.userData.idx === sel) open(); else select(o.userData.idx);
    },
    onKey(k) {
      if (k === 'arrowleft') select(sel - 1);
      else if (k === 'arrowright') select(sel + 1);
      else if (k === 'arrowup' || k === 'arrowdown') switchShelf();
      else if (k === 'a' || k === 'enter') open();
      else if (k === 'b') ctx.go('libreta');
      else if (dueno && (k === '+' || k === 'n')) openDeseo();
    },
  };
}
