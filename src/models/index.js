// Registro de objetos y el globo de nieve que los contiene.
import { T, M, COLORS as C, put } from '../engine/lib.js';
import { moto } from './moto.js';
import { lavadora, carro, regalo } from './objects.js';
import { sedan, deportivo, celular, camara, gimbal, laptop } from './detailed.js';
import { buildFromParts } from './parts.js';

/** Objetos disponibles en el formulario. `turn` es el giro que mejor lo muestra dentro del globo. */
export const MODELOS = {
  moto: { label: 'Moto deportiva', build: moto, color: '#2f5bd3', turn: -0.55, fit: 0.8 },
  sedan: { label: 'Sedán ejecutivo', build: sedan, color: '#eef1f6', turn: -0.6, fit: 0.84 },
  deportivo: { label: 'Sedán deportivo', build: deportivo, color: '#16161c', turn: -0.6, fit: 0.82 },
  carro: { label: 'Carro sencillo', build: carro, color: '#eef1f6', turn: -0.6, fit: 0.8 },
  lavadora: { label: 'Lavadora', build: lavadora, color: '#e9edf2', turn: 0.35, fit: 0.5 },
  celular: { label: 'Celular', build: celular, color: '#2f3a4f', turn: 0.25, fit: 0.42 },
  camara: { label: 'Cámara mirrorless', build: camara, color: '#1f2026', turn: 0.45, fit: 0.62 },
  gimbal: { label: 'Cámara de bolsillo', build: gimbal, color: '#2b2d33', turn: 0.4, fit: 0.32 },
  laptop: { label: 'Laptop gamer', build: laptop, color: '#2a2c34', turn: 0.3, fit: 0.7 },
  regalo: { label: 'Otro (caja de regalo)', build: regalo, color: '#d2463c', turn: 0.4, fit: 0.5 },
  ia: { label: 'Hecho por la IA', build: (c, piezas) => buildFromParts(piezas, c), color: '#d2463c', turn: 0.35, fit: 0.66, hidden: true },
};

export const COLORES = [
  { id: 'azul', label: 'Azul', hex: '#2f5bd3' },
  { id: 'blanco', label: 'Blanco', hex: '#eef1f6' },
  { id: 'negro', label: 'Negro', hex: '#1f2026' },
  { id: 'rojo', label: 'Rojo', hex: '#d2463c' },
  { id: 'plata', label: 'Plata', hex: '#b9c0cc' },
  { id: 'verde', label: 'Verde', hex: '#3e8e5a' },
];

export function buildModel(key, color, piezas) {
  const def = MODELOS[key] || MODELOS.regalo;
  return def.build(new T.Color(color || def.color).getHex(), piezas);
}

/**
 * Globo de nieve con el objeto adentro.
 * opts: pile (0–1.4, nieve acumulada en la base), frost (escarchado), sel (resaltado), turn, fit, flake.
 */
export function globe(obj, o = {}) {
  const g = new T.Group();
  const wood = M(C.woodMid), woodD = M(C.woodDark), snow = M(C.snow), brass = M(C.amber, { shininess: 40 });
  put(g, new T.Mesh(new T.CylinderGeometry(0.44, 0.52, 0.26, 10), wood), 0, 0.13, 0);
  put(g, new T.Mesh(new T.CylinderGeometry(0.52, 0.52, 0.05, 10), woodD), 0, 0.025, 0);
  put(g, new T.Mesh(new T.CylinderGeometry(0.455, 0.47, 0.035, 10), brass), 0, 0.2, 0);
  put(g, new T.Mesh(new T.CylinderGeometry(0.42, 0.45, 0.08, 10), snow), 0, 0.3, 0);
  for (let i = 0; i < 5; i++) { const m = put(g, new T.Mesh(new T.IcosahedronGeometry(0.09, 0), snow), Math.cos(i * 1.3) * 0.3, 0.34, Math.sin(i * 1.3) * 0.3); m.scale.y = 0.5; }
  if (o.pile > 0.05) {
    for (let i = 0; i < 9; i++) {
      const m = put(g, new T.Mesh(new T.IcosahedronGeometry(0.03 + o.pile * 0.03, 0), snow), Math.cos(i * 0.7) * 0.45, 0.27, Math.sin(i * 0.7) * 0.45);
      m.scale.y = 0.45;
    }
  }
  const bb = new T.Box3().setFromObject(obj), sz = new T.Vector3(), ct = new T.Vector3();
  bb.getSize(sz); bb.getCenter(ct);
  const k = Math.min((o.fit || 0.74) / Math.max(sz.x, sz.z), 0.6 / sz.y);
  obj.scale.setScalar(k);
  obj.position.set(-ct.x * k, 0.34 - bb.min.y * k, -ct.z * k);
  const holder = new T.Group();
  holder.rotation.y = o.turn || 0;
  holder.add(obj);
  g.add(holder);

  const N = 70, sg = new T.BufferGeometry(), sa = new Float32Array(N * 3), seed = [];
  for (let i = 0; i < N; i++) seed.push([Math.random() * 6.28, Math.random() * 0.4, 0.36 + Math.random() * 0.7, 0.0015 + Math.random() * 0.003]);
  sg.setAttribute('position', new T.BufferAttribute(sa, 3));
  g.add(new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: o.flake || 2, sizeAttenuation: false })));

  const glassMat = new T.MeshPhongMaterial({
    color: o.frost ? 0xdce6ff : 0xc9d2e6, transparent: true, opacity: o.frost ? 0.5 : 0.16, flatShading: true,
    shininess: 90, specular: 0xffffff, depthWrite: false, emissive: 0x000000,
  });
  const glass = put(g, new T.Mesh(new T.SphereGeometry(0.5, 14, 10), glassMat), 0, 0.64, 0);
  const setSelected = (on) => glassMat.emissive.setHex(on ? 0x3a2a10 : 0x000000);
  setSelected(!!o.sel);
  const tick = () => {
    for (let i = 0; i < N; i++) {
      const p = seed[i];
      p[0] += 0.006; p[2] -= p[3];
      if (p[2] < 0.36) p[2] = 1.06;
      sa[i * 3] = Math.cos(p[0]) * p[1]; sa[i * 3 + 1] = p[2]; sa[i * 3 + 2] = Math.sin(p[0]) * p[1];
    }
    sg.attributes.position.needsUpdate = true;
  };
  return { g, holder, glass, tick, setSelected };
}

/** Globo completo para un deseo. */
export function globeFor(deseo, extra = {}) {
  const def = MODELOS[deseo.modelo] || MODELOS.regalo;
  return globe(buildModel(deseo.modelo, deseo.color, deseo.piezas), { turn: def.turn, fit: def.fit, ...extra });
}

/** Dibuja un sticker pixelado (40×40) del objeto en un canvas 2D. */
export function drawSticker(c, x, y, modelo, color) {
  const col = color || (MODELOS[modelo] || MODELOS.regalo).color;
  const px = (a, b, w, h, f) => { c.fillStyle = f; c.fillRect(x + a, y + b, w, h); };
  px(-2, -2, 44, 44, '#FFFFFF');
  px(0, 0, 40, 40, '#161C42');
  switch (modelo) {
    case 'moto':
      px(5, 24, 10, 10, '#1B1B22'); px(25, 24, 10, 10, '#1B1B22'); px(8, 27, 4, 4, '#9FAAC8'); px(28, 27, 4, 4, '#9FAAC8');
      px(10, 16, 20, 8, '#EEF1F6'); px(14, 13, 12, 5, col); px(27, 11, 6, 8, col); px(8, 14, 6, 3, '#1B1B22'); break;
    case 'carro': case 'sedan': case 'deportivo':
      px(4, 18, 32, 9, col); px(11, 12, 16, 7, col); px(13, 13, 5, 5, '#1A2236'); px(20, 13, 5, 5, '#1A2236');
      px(7, 26, 7, 7, '#1B1B22'); px(26, 26, 7, 7, '#1B1B22'); px(34, 20, 2, 3, '#FFF3D0'); break;
    case 'lavadora':
      px(10, 8, 20, 26, col); px(10, 8, 20, 5, '#9FAAC8'); px(13, 9, 6, 2, '#7FD1FF'); px(14, 17, 12, 10, '#2F5BD3'); px(16, 19, 4, 3, '#4A78E8'); break;
    case 'celular':
      px(13, 5, 14, 30, col); px(14, 7, 12, 25, '#10162E'); px(16, 10, 3, 3, '#D2463C'); px(21, 10, 3, 3, '#F2B35C'); px(16, 15, 3, 3, '#3E8E5A'); px(21, 15, 3, 3, '#4A78E8'); break;
    case 'camara':
      px(6, 13, 28, 18, col); px(13, 9, 10, 5, col); px(14, 15, 12, 12, '#3A3D46'); px(16, 17, 8, 8, '#1C2A55'); px(17, 18, 2, 2, '#9FB6FF'); px(28, 10, 4, 3, '#B9C0CC'); break;
    case 'gimbal':
      px(17, 16, 7, 20, col); px(15, 8, 10, 9, '#101014'); px(18, 10, 4, 4, '#1C2A55'); px(19, 26, 3, 3, '#D2463C'); break;
    case 'laptop':
      px(7, 7, 26, 18, col); px(9, 9, 22, 14, '#0F1838'); px(11, 12, 10, 2, '#7FD1FF'); px(11, 16, 14, 2, '#4A78E8'); px(4, 26, 32, 5, col); px(8, 27, 24, 2, '#3A3D46'); break;
    default:
      px(9, 13, 22, 20, col); px(8, 10, 24, 5, col); px(18, 10, 4, 23, '#F2B35C'); px(8, 12, 24, 3, '#F2B35C'); px(14, 6, 5, 4, '#F2B35C'); px(21, 6, 5, 4, '#F2B35C');
  }
}
