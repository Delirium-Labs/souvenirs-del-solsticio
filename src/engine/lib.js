// Ayudantes de geometría low-poly y texturas de texto pixeladas.
import * as THREE from 'three';

export const T = THREE;

export const COLORS = {
  white: 0xeef1f6, navy: 0x1b2a6b, blue: 0x2f5bd3, sky: 0x4a78e8, black: 0x16161c,
  coal: 0x34363f, silver: 0xb9c0cc, red: 0xd2463c, amber: 0xf2b35c,
  wood: 0x8c5634, woodMid: 0x6b3f24, woodDark: 0x4a2c1a, snow: 0xe6ecf7, pine: 0x1f4a3a,
};

/** Material plano estilo PS1 (sombreado por cara). */
export const M = (c, o) => new THREE.MeshPhongMaterial(Object.assign({ color: c, flatShading: true, shininess: 0 }, o || {}));
/** Material sin luz (focos, pantallas, llamas). */
export const B = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o || {}));

export const put = (g, o, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); g.add(o); return o; };
export const box = (g, w, h, d, m, x, y, z) => put(g, new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z);
export const cyl = (g, r1, r2, h, seg, m, x, y, z) => put(g, new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m), x, y, z);
/** Cilindro acostado sobre el eje Z (ruedas, discos, lentes). */
export const cylZ = (g, r, h, seg, m, x, y, z) => { const o = cyl(g, r, r, h, seg, m, x, y, z); o.rotation.x = Math.PI / 2; return o; };

/** Extruye un perfil 2D (plano XY) y lo centra en Z. */
export function ext(g, pts, depth, m) {
  const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
  const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  return put(g, new THREE.Mesh(geo, m));
}

/** Cilindro entre dos puntos del plano XY a la profundidad z. */
export function rod(g, a, b, r, m, z = 0) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const o = put(g, new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.hypot(dx, dy), 6), m), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z);
  o.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
  return o;
}

/** Barra rectangular entre dos puntos del plano XY. */
export function bar(g, a, b, t, d, m, z = 0) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const o = put(g, new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(dx, dy), t, d), m), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z);
  o.rotation.z = Math.atan2(dy, dx);
  return o;
}

/** Ajusta el tamaño de fuente hasta que el texto quepa en maxW. */
export function fit(c, txt, font, px, maxW) {
  let k = px;
  c.font = font.replace('{}', k + 'px');
  while (k > 6 && c.measureText(txt).width > maxW) { k -= 1; c.font = font.replace('{}', k + 'px'); }
}

/** Parte un texto en líneas que quepan en maxW con la fuente actual. */
export function wrap(c, txt, maxW, maxLines = 2) {
  const words = String(txt).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (c.measureText(test).width <= maxW || !cur) cur = test;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const keep = lines.slice(0, maxLines);
    let last = keep[maxLines - 1];
    while (last.length > 1 && c.measureText(last + '…').width > maxW) last = last.slice(0, -1);
    keep[maxLines - 1] = last + '…';
    return keep;
  }
  return lines;
}

export const FONT_TITLE = "{} 'Press Start 2P', monospace";
export const FONT_TEXT = "{} 'VT323', monospace";

/** Textura de canvas 1:1 (sin suavizado) que se redibuja cuando cargan las fuentes. */
export function tex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  const redraw = () => { x.clearRect(0, 0, w, h); x.textBaseline = 'top'; draw(x, w, h); t.needsUpdate = true; };
  redraw();
  fontsReady.then(redraw, () => {});
  return t;
}

export const fontsReady = (document.fonts && document.fonts.load)
  ? Promise.all([document.fonts.load("16px 'VT323'"), document.fonts.load("8px 'Press Start 2P'")])
  : Promise.resolve();

/** Libera geometrías, materiales y texturas de una escena. */
export function disposeTree(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
  });
}

/** Copos que caen en una caja. Devuelve { points, tick }. */
export function snowfall(n, sx, sy, sz, { y0 = 0, size = 2, color = 0xe6ecf7, speed = 0.02 } = {}) {
  const g = new THREE.BufferGeometry();
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = (Math.random() - 0.5) * sx; a[i * 3 + 1] = y0 + Math.random() * sy; a[i * 3 + 2] = (Math.random() - 0.5) * sz; }
  g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  const points = new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: false }));
  const tick = (t) => {
    for (let i = 0; i < n; i++) {
      let y = a[i * 3 + 1] - (speed + (i % 5) * speed * 0.25);
      if (y < y0) y = y0 + sy;
      a[i * 3 + 1] = y;
      a[i * 3] += Math.sin(t + i) * 0.003;
    }
    g.attributes.position.needsUpdate = true;
  };
  return { points, tick };
}

/** Pino low-poly. */
export function pine(g, x, z, k = 1) {
  cyl(g, 0.15 * k, 0.2 * k, 0.6 * k, 5, M(0x4a2c1a), x, 0.3 * k, z);
  [[1.3, 1.6, 1.1], [1.0, 1.4, 2.0], [0.7, 1.2, 2.8]].forEach((a) => put(g, new THREE.Mesh(new THREE.ConeGeometry(a[0] * k, a[1] * k, 6), M(COLORS.pine)), x, a[2] * k, z));
  put(g, new THREE.Mesh(new THREE.ConeGeometry(0.32 * k, 0.45 * k, 6), M(COLORS.snow)), x, 3.25 * k, z);
}
