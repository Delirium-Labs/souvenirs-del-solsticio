// Objetos hechos por la IA: una lista de piezas primitivas (validada) que se arma en 3D.
import { T, M, B } from '../engine/lib.js';

export const MAX_PIEZAS = 60;
const FORMAS = ['box', 'cylinder', 'sphere', 'cone', 'torus'];
const HEX = /^#?[0-9a-fA-F]{6}$/;

const num = (v, min, max, def = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
const vec = (v, min, max, def) => (Array.isArray(v) ? [0, 1, 2].map((i) => num(v[i], min, max, def[i])) : def);

/** Limpia lo que devuelve la IA: formas permitidas, números acotados y colores válidos. */
export function sanitizeParts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_PIEZAS).filter((p) => p && FORMAS.includes(p.shape)).map((p) => ({
    shape: p.shape,
    size: vec(p.size, 0.005, 2, [0.2, 0.2, 0.2]),
    pos: vec(p.pos, -1.5, 2.5, [0, 0, 0]),
    rot: vec(p.rot, -7, 7, [0, 0, 0]),
    color: HEX.test(String(p.color || '')) ? '#' + String(p.color).replace('#', '') : '#9faac8',
    glow: !!p.glow,
  }));
}

/** Arma las piezas como un grupo 3D. */
export function buildFromParts(parts, tint) {
  const g = new T.Group();
  const list = sanitizeParts(parts);
  if (!list.length) list.push({ shape: 'box', size: [0.6, 0.6, 0.6], pos: [0, 0.3, 0], rot: [0, 0, 0], color: tint || '#d2463c', glow: false });
  for (const p of list) {
    const [a, b, c] = p.size;
    let geo;
    if (p.shape === 'box') geo = new T.BoxGeometry(a, b, c);
    else if (p.shape === 'cylinder') geo = new T.CylinderGeometry(a, b, c, 10);
    else if (p.shape === 'sphere') geo = new T.IcosahedronGeometry(a, 1);
    else if (p.shape === 'cone') geo = new T.ConeGeometry(a, b, 8);
    else geo = new T.TorusGeometry(a, Math.min(b, a), 4, 12);
    const mat = p.glow ? B(p.color) : M(p.color, { shininess: 30 });
    const mesh = new T.Mesh(geo, mat);
    mesh.position.set(...p.pos);
    mesh.rotation.set(...p.rot);
    g.add(mesh);
  }
  return g;
}
