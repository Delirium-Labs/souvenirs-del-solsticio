// 5 · Libreta: escritorio con la libreta abierta (logros a la izquierda, stickers a la derecha).
import { T, M, B, box, put, bar, tex, fit, FONT_TITLE, FONT_TEXT, COLORS as C } from '../engine/lib.js';
import { globeFor, drawSticker } from '../models/index.js';
import { LOGROS, capitulo } from '../data/rules.js';
import { setHud } from '../ui/hud.js';

const P = '#EFE6D2', INK = '#1B1B22', SOFT = '#3B3A40', MUTED = '#8A8172', AMB = '#F2B35C';

const dashed = (c, x, y, w, h) => {
  c.fillStyle = MUTED;
  for (let k = 0; k < w; k += 4) { c.fillRect(x + k, y, 2, 1); c.fillRect(x + k, y + h - 1, 2, 1); }
  for (let k = 0; k < h; k += 4) { c.fillRect(x, y + k, 1, 2); c.fillRect(x + w - 1, y + k, 1, 2); }
};

export async function libreta(ctx) {
  const { store } = ctx;
  const state = await store.get();
  const now = store.now();
  const hechos = LOGROS.filter((l) => state.logros[l.id]).length;

  const s = new T.Scene();
  s.background = new T.Color(0x1a110c);
  const cam = new T.PerspectiveCamera(40, 4 / 3, 0.1, 60);

  // Escritorio
  for (let i = 0; i < 10; i++) box(s, 1.0, 0.2, 9, M(i % 2 ? 0x5a3520 : 0x633b24), -4.5 + i * 1.0, -0.1, 0);
  for (let i = 0; i < 10; i++) box(s, 0.02, 0.01, 9, M(0x3a2214), -4.0 + i * 1.0, 0.0, 0);

  // Libreta: pasta, bloques de hojas, lomo, cinta y elástico
  box(s, 3.4, 0.06, 2.24, M(0x6b2e2a), 0, 0.03, 0.2);
  [-0.82, 0.82].forEach((x) => box(s, 1.6, 0.05, 2.06, M(0xd9cfb8), x, 0.085, 0.2));
  box(s, 0.05, 0.02, 2.06, M(0x9c8f76), 0, 0.1, 0.2);
  box(s, 0.06, 0.012, 0.9, M(C.red), 0.12, 0.112, 1.55);
  box(s, 0.05, 0.08, 2.24, M(0x1b1b22), 1.62, 0.07, 0.2);

  const page = (draw, x) => {
    const t = tex(160, 208, (c, w, h) => {
      c.fillStyle = P; c.fillRect(0, 0, w, h);
      c.fillStyle = '#E3D8C0'; for (let y = 30; y < h; y += 16) c.fillRect(6, y, w - 12, 1);
      draw(c, w, h);
    });
    const pl = put(s, new T.Mesh(new T.PlaneGeometry(1.52, 2.0), new T.MeshLambertMaterial({ map: t })), x, 0.113, 0.2);
    pl.rotation.x = -Math.PI / 2;
  };

  page((c, w) => {
    c.fillStyle = INK; fit(c, 'LIBRETA DE LOGROS', FONT_TITLE, 8, w - 16); c.fillText('LIBRETA DE LOGROS', 8, 8);
    const sub = `${hechos} de ${LOGROS.length} desbloqueados`;
    c.fillStyle = SOFT; fit(c, sub, FONT_TEXT, 15, w - 16); c.fillText(sub, 8, 19);
    LOGROS.forEach((l, i) => {
      const y = 40 + i * 23;
      const ok = !!state.logros[l.id];
      if (ok) {
        c.fillStyle = AMB; c.fillRect(8, y + 2, 12, 12);
        c.fillStyle = INK; c.fillRect(10, y + 8, 2, 2); c.fillRect(12, y + 10, 2, 2); c.fillRect(14, y + 8, 2, 2); c.fillRect(16, y + 6, 2, 2);
      } else dashed(c, 8, y + 2, 12, 12);
      const title = ok ? l.nombre : '???';
      const hint = ok ? l.pista : 'Pista: ' + l.pista.charAt(0).toLowerCase() + l.pista.slice(1);
      c.fillStyle = ok ? INK : MUTED; fit(c, title, FONT_TEXT, 15, w - 34); c.fillText(title, 26, y);
      c.fillStyle = ok ? SOFT : MUTED; fit(c, hint, FONT_TEXT, 12, w - 34); c.fillText(hint, 26, y + 12);
    });
  }, -0.8);

  page((c, w, h) => {
    c.fillStyle = INK; fit(c, 'STICKERS', FONT_TITLE, 8, w - 16); c.fillText('STICKERS', 8, 8);
    c.fillStyle = SOFT; fit(c, 'Uno por cada souvenir', FONT_TEXT, 15, w - 16); c.fillText('Uno por cada souvenir', 8, 19);
    const compras = state.compras.slice(-9);
    for (let i = 0; i < 9; i++) {
      const x = 14 + (i % 3) * 46, y = 42 + Math.floor(i / 3) * 46;
      if (compras[i]) drawSticker(c, x, y, compras[i].deseo.modelo, compras[i].deseo.color);
      else dashed(c, x, y, 40, 40);
    }
    if (state.compras.length > 9) { c.fillStyle = SOFT; fit(c, `+${state.compras.length - 9} más`, FONT_TEXT, 13, 60); c.fillText(`+${state.compras.length - 9} más`, w - 60, 182); }
    const cap = 'Capítulo: ' + capitulo(now);
    c.fillStyle = SOFT; fit(c, cap, FONT_TEXT, 13, w - 16); c.fillText(cap, 8, h - 18);
  }, 0.8);

  // Lámpara
  const lamp = put(s, new T.Group(), -2.35, 0, -0.9);
  box(lamp, 0.6, 0.08, 0.6, M(C.pine), 0, 0.04, 0);
  bar(lamp, [0, 0.08], [0.25, 1.1], 0.06, 0.06, M(C.pine), 0);
  bar(lamp, [0.25, 1.1], [0.85, 1.3], 0.06, 0.06, M(C.pine), 0);
  const shade = put(lamp, new T.Mesh(new T.ConeGeometry(0.3, 0.36, 8, 1, true), M(C.pine, { side: T.DoubleSide })), 0.95, 1.2, 0);
  shade.rotation.z = -0.5;
  box(lamp, 0.12, 0.12, 0.12, B(0xfff0c8), 0.99, 1.11, 0);
  lamp.rotation.y = -0.6;
  const lampLight = new T.PointLight(0xffcf8a, 1.5, 6); lampLight.position.set(-1.3, 1.6, -0.2); s.add(lampLight);

  // Taza con malvaviscos y vapor
  const mug = put(s, new T.Group(), 1.95, 0, 0.95);
  put(mug, new T.Mesh(new T.CylinderGeometry(0.24, 0.22, 0.42, 10), M(C.red)), 0, 0.21, 0);
  put(mug, new T.Mesh(new T.TorusGeometry(0.12, 0.035, 4, 8), M(C.red)), 0.26, 0.22, 0);
  put(mug, new T.Mesh(new T.CylinderGeometry(0.21, 0.21, 0.02, 10), M(C.woodDark)), 0, 0.4, 0);
  [[0.05, 0.03], [-0.06, -0.04], [0.02, 0.07]].forEach((p) => box(mug, 0.07, 0.05, 0.07, M(0xeef1f6), p[0], 0.42, p[1]));
  const steam = [];
  for (let i = 0; i < 5; i++) steam.push(put(s, new T.Mesh(new T.IcosahedronGeometry(0.06, 0), B(0xe6ecf7, { transparent: true, opacity: 0.4 }))));

  // Lápiz
  const pencil = put(s, new T.Group(), 2.0, 0.05, 0.15);
  pencil.rotation.y = 0.9;
  put(pencil, new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.9, 6), M(C.amber))).rotation.z = Math.PI / 2;
  put(pencil, new T.Mesh(new T.ConeGeometry(0.04, 0.12, 6), M(0xe8c9a0)), 0.51, 0, 0).rotation.z = -Math.PI / 2;
  put(pencil, new T.Mesh(new T.CylinderGeometry(0.042, 0.042, 0.08, 6), M(0xd98a9a)), -0.49, 0, 0).rotation.z = Math.PI / 2;

  // Recibo de la última compra y su globo como trofeo
  const ultima = state.compras[state.compras.length - 1];
  let trophy = null;
  if (ultima) {
    const rc = tex(48, 96, (c, w, h) => {
      c.fillStyle = P; c.fillRect(0, 0, w, h);
      c.fillStyle = MUTED; for (let y = 10; y < h - 16; y += 7) c.fillRect(5, y, 10 + ((y * 7) % 26), 2);
      c.fillStyle = INK; c.fillRect(5, h - 14, w - 10, 4);
      c.fillStyle = '#B23A31'; c.fillRect(20, 40, 22, 2); c.fillRect(20, 50, 22, 2); c.fillRect(20, 40, 2, 12); c.fillRect(40, 40, 2, 12);
    });
    const receipt = put(s, new T.Mesh(new T.PlaneGeometry(0.5, 1.0), new T.MeshLambertMaterial({ map: rc })), -2.05, 0.012, 1.15);
    receipt.rotation.x = -Math.PI / 2;
    receipt.rotation.z = 0.25;
    trophy = globeFor(ultima.deseo);
    trophy.g.scale.setScalar(0.85);
    trophy.g.position.set(2.05, 0, -1.2);
    s.add(trophy.g);
  }

  // Vela
  box(s, 0.12, 0.3, 0.12, M(0xefe6d2), -0.2, 0.15, -1.45);
  const flame = box(s, 0.06, 0.1, 0.06, B(C.amber), -0.2, 0.36, -1.45);
  const cl = new T.PointLight(C.amber, 0.5, 2.5); cl.position.set(-0.2, 0.5, -1.4); s.add(cl);

  s.add(new T.AmbientLight(0x6a76b8, 0.5));
  const key = new T.DirectionalLight(0xffe2b8, 0.35); key.position.set(-2, 5, 3); s.add(key);

  setHud(ctx.hud, `
    <div class="desk-actions">
      <button type="button" class="btn outline small" id="back">◄ VOLVER A LA VITRINA</button>
    </div>`);
  ctx.hud.querySelector('#back').onclick = () => ctx.go('vitrina');

  return {
    scene: s,
    camera: cam,
    update(t) {
      cam.position.set(Math.sin(t * 0.25) * 0.15, 4.3, 2.75);
      cam.lookAt(0, 0, 0.12);
      if (trophy) { trophy.tick(); trophy.holder.rotation.y += 0.006; }
      flame.scale.y = 0.8 + Math.sin(t * 9) * 0.25;
      steam.forEach((st, i) => {
        const ph = (t * 0.4 + i / steam.length) % 1;
        st.position.set(1.95 + Math.sin(ph * 6 + i) * 0.08, 0.5 + ph * 0.9, 0.95);
        st.scale.setScalar(0.6 + ph * 1.4);
        st.material.opacity = 0.45 * (1 - ph);
      });
    },
    onKey(k) { if (k === 'b' || k === 'escape' || k === 'enter') ctx.go('vitrina'); },
  };
}
