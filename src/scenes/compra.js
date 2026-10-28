// 4 · Compra: el duende entrega la bolsa con el globo y se imprime el recibo.
import { T, M, B, box, put, cyl, COLORS as C } from '../engine/lib.js';
import { globeFor } from '../models/index.js';
import { LOGROS, fechaCorta, dinero } from '../data/rules.js';
import { setHud, esc } from '../ui/hud.js';

function duende() {
  const elf = new T.Group();
  const skin = M(0xe8b48a), green = M(0x3e8e5a), red = M(C.red);
  put(elf, new T.Mesh(new T.ConeGeometry(0.42, 1.0, 6), green), 0, 0.5, 0);
  put(elf, new T.Mesh(new T.CylinderGeometry(0.3, 0.36, 0.1, 6), red), 0, 0.98, 0);
  for (let i = 0; i < 6; i++) put(elf, new T.Mesh(new T.ConeGeometry(0.07, 0.16, 3), red), Math.cos(i * 1.05) * 0.3, 0.92, Math.sin(i * 1.05) * 0.3).rotation.x = Math.PI;
  put(elf, new T.Mesh(new T.CylinderGeometry(0.37, 0.4, 0.07, 6), M(0x1b1b22)), 0, 0.62, 0);
  box(elf, 0.12, 0.1, 0.03, M(C.amber), 0, 0.62, 0.37);
  put(elf, new T.Mesh(new T.IcosahedronGeometry(0.32, 0), skin), 0, 1.3, 0);
  put(elf, new T.Mesh(new T.ConeGeometry(0.08, 0.3, 4), skin), -0.36, 1.32, 0).rotation.z = Math.PI / 2;
  put(elf, new T.Mesh(new T.ConeGeometry(0.08, 0.3, 4), skin), 0.36, 1.32, 0).rotation.z = -Math.PI / 2;
  box(elf, 0.06, 0.08, 0.02, B(0x1b1b22), -0.11, 1.35, 0.3);
  box(elf, 0.06, 0.08, 0.02, B(0x1b1b22), 0.11, 1.35, 0.3);
  box(elf, 0.08, 0.04, 0.02, red, -0.18, 1.25, 0.28);
  box(elf, 0.08, 0.04, 0.02, red, 0.18, 1.25, 0.28);
  box(elf, 0.12, 0.03, 0.02, B(0x8c2f2a), 0, 1.2, 0.31);
  put(elf, new T.Mesh(new T.CylinderGeometry(0.33, 0.33, 0.08, 6), red), 0, 1.55, 0);
  put(elf, new T.Mesh(new T.ConeGeometry(0.32, 0.7, 6), green), 0.05, 1.92, 0).rotation.z = -0.25;
  put(elf, new T.Mesh(new T.IcosahedronGeometry(0.09, 0), M(C.snow)), 0.2, 2.25, 0);
  put(elf, new T.Mesh(new T.IcosahedronGeometry(0.06, 0), M(C.amber)), 0.2, 2.18, 0.05);
  box(elf, 0.8, 0.13, 0.13, green, 0.67, 1.02, 0.45).rotation.z = 0.2;
  put(elf, new T.Mesh(new T.IcosahedronGeometry(0.08, 0), skin), 1.05, 1.1, 0.65);
  return elf;
}

export async function compra(ctx, params = {}) {
  const { store } = ctx;
  const state = await store.get();
  const c = state.compras.find((x) => x.id === params.compraId) || state.compras[state.compras.length - 1];
  if (!c) throw new Error('Todavía no hay compras.');
  const nuevos = (params.nuevos || []).map((id) => LOGROS.find((l) => l.id === id)).filter(Boolean);

  const s = new T.Scene();
  s.background = new T.Color(0x161c42);
  s.fog = new T.Fog(0x161c42, 7, 16);
  const cam = new T.PerspectiveCamera(45, 4 / 3, 0.1, 100);

  // Cuarto: pared, repisa con globos, ventana y mostrador
  box(s, 14, 7, 0.2, M(0x1a2150), 0, 3, -2.2);
  for (let i = -7; i <= 7; i++) box(s, 0.45, 7, 0.05, M(0x161c42), i, 3, -2.08);
  box(s, 1.8, 3.2, 0.4, M(0x2a1f3d), -3.4, 2.6, -1.9);
  [1.6, 2.6, 3.6].forEach((y) => box(s, 1.8, 0.08, 0.45, M(C.woodMid), -3.4, y, -1.85));
  [[-3.8, 1.75], [-3.0, 2.75], [-3.6, 3.75]].forEach((p) => put(s, new T.Mesh(new T.IcosahedronGeometry(0.16, 1), new T.MeshPhongMaterial({ color: 0xc9d2e6, transparent: true, opacity: 0.35, flatShading: true })), p[0], p[1], -1.8));
  box(s, 1.4, 1.6, 0.1, M(C.woodDark), 1.3, 3.0, -2.05);
  box(s, 1.2, 1.4, 0.05, B(0x0d1433), 1.3, 3.0, -2.0);
  box(s, 1.2, 0.05, 0.07, M(C.woodDark), 1.3, 3.0, -1.98);
  box(s, 0.05, 1.4, 0.07, M(C.woodDark), 1.3, 3.0, -1.98);
  box(s, 1.2, 0.14, 0.1, M(C.snow), 1.3, 2.3, -1.95);
  box(s, 9, 1.1, 1.4, M(C.woodMid), 0, 0.55, 0.9);
  box(s, 9.1, 0.1, 1.5, M(C.wood), 0, 1.12, 0.9);
  box(s, 9, 0.05, 0.02, M(C.woodDark), 0, 0.6, 1.61);

  const elf = duende();
  elf.position.set(-1.6, 0.8, -0.2);
  s.add(elf);

  // Bolsa con el globo comprado
  const bag = new T.Group();
  const mg = globeFor(c.deseo, { flake: 2 });
  mg.g.scale.setScalar(0.62);
  mg.g.position.set(0, 0.5, 0.02);
  bag.add(mg.g);
  [[-0.18, 0.2], [0.2, -0.25], [0.05, 0.4]].forEach((a) => { put(bag, new T.Mesh(new T.ConeGeometry(0.12, 0.3, 3), M(0xeef1f6)), a[0], 0.78, 0).rotation.z = a[1]; });
  box(bag, 0.6, 0.7, 0.35, M(0xb88a57), 0, 0.35, 0);
  box(bag, 0.62, 0.06, 0.37, M(0x9c7244), 0, 0.7, 0);
  put(bag, new T.Mesh(new T.TorusGeometry(0.12, 0.02, 4, 8, Math.PI), M(0x6b4a2e)), 0, 0.71, 0.12);
  put(bag, new T.Mesh(new T.TorusGeometry(0.12, 0.02, 4, 8, Math.PI), M(0x6b4a2e)), 0, 0.71, -0.12);
  box(bag, 0.08, 0.7, 0.02, M(C.red), 0, 0.35, 0.18);
  box(bag, 0.6, 0.08, 0.02, M(C.red), 0, 0.42, 0.18);
  put(bag, new T.Mesh(new T.IcosahedronGeometry(0.07, 0), M(C.red)), 0, 0.42, 0.2);
  box(bag, 0.14, 0.1, 0.01, M(0xefe6d2), 0.18, 0.2, 0.185);
  bag.position.set(-0.5, 1.17, 0.5);
  s.add(bag);

  // Caja registradora, campanita, frasco de bastones y guirnalda
  const reg = new T.Group();
  box(reg, 0.9, 0.35, 0.6, M(0x8c2f2a), 0, 0.17, 0);
  box(reg, 0.8, 0.06, 0.4, M(0x5a1f1b), 0, 0.37, 0.08).rotation.x = 0.35;
  for (let i = 0; i < 12; i++) box(reg, 0.1, 0.04, 0.08, M(0xefe6d2), -0.3 + (i % 4) * 0.2, 0.42 - Math.floor(i / 4) * 0.03, 0.18 - Math.floor(i / 4) * 0.1);
  box(reg, 0.4, 0.22, 0.06, M(0x1b1b22), 0.1, 0.62, -0.18);
  box(reg, 0.32, 0.12, 0.02, B(0x7fd1ff), 0.1, 0.63, -0.14);
  box(reg, 0.85, 0.08, 0.5, M(C.amber), 0, 0.02, 0.05);
  reg.position.set(-2.35, 1.17, 1.05);
  reg.rotation.y = 0.5;
  s.add(reg);
  cyl(s, 0.03, 0.18, 0.18, 8, M(C.amber), -1.15, 1.26, 1.25);
  cyl(s, 0.02, 0.02, 0.08, 6, M(0x1b1b22), -1.15, 1.39, 1.25);
  cyl(s, 0.15, 0.15, 0.36, 8, new T.MeshPhongMaterial({ color: 0xc9d2e6, transparent: true, opacity: 0.35, flatShading: true }), 0.3, 1.35, 1.3);
  for (let i = 0; i < 3; i++) box(s, 0.04, 0.45, 0.04, M(i % 2 ? 0xeef1f6 : C.red), 0.25 + i * 0.05, 1.45, 1.3 + (i - 1) * 0.04);
  const bulbColors = [C.red, C.amber, 0x3e8e5a, 0x4a78e8];
  const bulbs = [];
  for (let i = 0; i < 20; i++) {
    box(s, 0.42, 0.06, 0.06, M(C.pine), -4.3 + i * 0.45, 0.98 - Math.abs(Math.sin(i * 0.7)) * 0.12, 1.66);
    bulbs.push(box(s, 0.08, 0.1, 0.08, B(bulbColors[i % 4]), -4.3 + i * 0.45, 0.9 - Math.abs(Math.sin(i * 0.7)) * 0.12, 1.7));
  }

  s.add(new T.AmbientLight(0x6a76b8, 0.65));
  const warm = new T.PointLight(C.amber, 1.4, 12); warm.position.set(-1, 3, 3); s.add(warm);
  const key = new T.DirectionalLight(0xffffff, 0.35); key.position.set(2, 4, 5); s.add(key);

  const d = c.deseo;
  const toast = nuevos.length
    ? `<div class="toast passive" role="status"><p class="t1">LOGRO DESBLOQUEADO</p><p class="t2">${esc(nuevos[0].nombre)}${nuevos.length > 1 ? ` +${nuevos.length - 1}` : ''}</p></div>`
    : '';
  setHud(ctx.hud, `
    ${toast}
    <p class="bubble passive">¡Gracias por esperar! Aquí está tu souvenir.</p>
    <section class="receipt passive" aria-label="Recibo">
      <div class="head"><p class="h1">SOUVENIRS DEL SOLSTICIO</p><p class="h2">DE INVIERNO</p><p class="muted">Recibo #${String(c.numero).padStart(4, '0')}</p></div>
      <div class="rule"></div>
      <p class="item">${esc(d.nombre)}</p>
      <div class="row"><span>Valor</span><span>${esc(dinero(c.valor))}</span></div>
      <div class="row"><span>En vitrina</span><span>${c.dias} días</span></div>
      <div class="row"><span>Concepto</span><span>${esc(d.categoria)}</span></div>
      <div class="row"><span>Capítulo</span><span>${esc(c.capitulo)}</span></div>
      <div class="row"><span>Fecha</span><span>${esc(fechaCorta(c.fecha))}</span></div>
      <div class="rule"></div>
      <div class="total"><span>TOTAL</span><span>${esc(dinero(c.valor))}</span></div>
      <p class="muted" style="text-align:center;margin-top:6px">Esperaste. Valió la pena.</p>
    </section>
    <p class="stamp passive">COMPRADO</p>
    <div class="buy-actions">
      <button type="button" class="btn ghost small" id="shop">SEGUIR VIENDO</button>
      <button type="button" class="btn outline small" id="book">VER LIBRETA ►</button>
    </div>`);
  ctx.hud.querySelector('#shop').onclick = () => ctx.go('vitrina');
  ctx.hud.querySelector('#book').onclick = () => ctx.go('libreta');

  return {
    scene: s,
    camera: cam,
    update(t) {
      cam.position.set(0, 1.6, 5);
      cam.lookAt(0, 1.3, 0);
      elf.position.y = 0.8 + Math.sin(t * 2) * 0.03;
      elf.rotation.z = Math.sin(t * 1.5) * 0.03;
      mg.holder.rotation.y = t * 0.6;
      mg.tick();
      bag.rotation.z = Math.sin(t * 1.2) * 0.02;
      bulbs.forEach((b, i) => { b.visible = ((Math.floor(t * 2) + i) % 4) !== 0; });
    },
    onKey(k) { if (k === 'b' || k === 'enter') ctx.go('libreta'); else if (k === 'escape') ctx.go('vitrina'); },
  };
}
