// Moto deportiva low-poly basada en la Gixxer SF (sin logos). El color cambia el tanque, la trompa y las franjas.
import { T, M, B, COLORS as C, put, box, cylZ, ext, rod, bar } from '../engine/lib.js';

function wheel(g, x, y, disc, S, K, Co, R) {
  const w = put(g, new T.Group(), x, y, 0);
  w.add(new T.Mesh(new T.TorusGeometry(0.25, 0.055, 6, 20), K));
  w.add(new T.Mesh(new T.TorusGeometry(0.195, 0.022, 4, 20), Co));
  [0.03, -0.03].forEach((z) => { const s = new T.Mesh(new T.TorusGeometry(0.207, 0.009, 3, 20), R); s.position.z = z; w.add(s); });
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + 0.2;
    const sp = new T.Mesh(new T.BoxGeometry(0.18, 0.026, 0.026), Co);
    sp.position.set(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0);
    sp.rotation.z = a;
    w.add(sp);
  }
  cylZ(w, 0.04, 0.14, 8, S, 0, 0, 0);
  if (disc) {
    cylZ(w, disc, 0.012, 16, S, 0, 0, 0.06);
    cylZ(w, disc * 0.55, 0.016, 10, Co, 0, 0, 0.062);
  }
  return w;
}

export function moto(color = 0x2f5bd3) {
  const main = new T.Color(color);
  const light = main.clone().lerp(new T.Color(0xffffff), 0.25);
  const dark = main.clone().lerp(new T.Color(0x000000), 0.55);
  const g = new T.Group();
  const W = M(C.white, { shininess: 30 }), N = M(dark), Bl = M(main, { shininess: 30 }), Sk = M(light), K = M(C.black), Co = M(C.coal);
  const S = M(C.silver, { shininess: 60 }), R = M(C.red);

  wheel(g, 0.68, 0.3, 0.15, S, K, Co, R);
  wheel(g, -0.66, 0.3, 0.11, S, K, Co, R);
  box(g, 0.08, 0.1, 0.04, K, 0.57, 0.38, 0.09);
  box(g, 0.06, 0.08, 0.04, K, -0.76, 0.37, 0.09);

  [0.1, -0.1].forEach((z) => { rod(g, [0.68, 0.3], [0.6, 0.6], 0.03, K, z); rod(g, [0.6, 0.6], [0.51, 0.93], 0.024, S, z); });
  box(g, 0.08, 0.03, 0.26, K, 0.51, 0.93, 0);
  const ff = put(g, new T.Mesh(new T.TorusGeometry(0.33, 0.035, 3, 8, 1.6), K), 0.68, 0.3, 0);
  ff.rotation.z = 0.4; ff.scale.z = 3;

  // Motor y cilindro con aletas
  box(g, 0.34, 0.28, 0.26, Co, 0.06, 0.36, 0);
  const cy = put(g, new T.Group(), 0.24, 0.5, 0);
  cy.rotation.z = -0.4;
  box(cy, 0.14, 0.22, 0.2, Co, 0, 0, 0);
  for (let i = 0; i < 5; i++) box(cy, 0.2, 0.016, 0.24, S, 0, -0.08 + i * 0.04, 0);
  cylZ(g, 0.09, 0.03, 10, S, 0.02, 0.33, 0.14);
  cylZ(g, 0.06, 0.03, 8, S, 0.16, 0.28, -0.14);

  // Chasis, subchasis y basculante
  [0.13, -0.13].forEach((z) => { bar(g, [0.5, 0.88], [0.0, 0.6], 0.05, 0.03, K, z); bar(g, [0.0, 0.62], [-0.04, 0.36], 0.05, 0.03, K, z); });
  [0.11, -0.11].forEach((z) => bar(g, [-0.04, 0.62], [-0.6, 0.84], 0.035, 0.025, K, z));
  [0.12, -0.12].forEach((z) => bar(g, [-0.04, 0.36], [-0.66, 0.3], 0.06, 0.04, K, z));
  cylZ(g, 0.03, 0.3, 8, S, -0.04, 0.36, 0);

  // Amortiguador trasero con resorte rojo
  const sh = put(g, new T.Group(), -0.16, 0.56, 0);
  sh.rotation.z = Math.atan2(0.3, -0.12) - Math.PI / 2;
  sh.add(new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.34, 6), S));
  for (let i = 0; i < 7; i++) { const ring = new T.Mesh(new T.TorusGeometry(0.042, 0.012, 4, 10), R); ring.rotation.x = Math.PI / 2; ring.position.y = -0.11 + i * 0.035; sh.add(ring); }

  // Carenado, franjas, trompa, quilla, tanque, asiento y cola
  ext(g, [[0.66, 0.7], [0.58, 0.46], [0.4, 0.4], [0.22, 0.44], [0.1, 0.56], [0.04, 0.72], [0.2, 0.84], [0.46, 0.92], [0.54, 0.8]], 0.4, W);
  ext(g, [[0.6, 0.6], [0.5, 0.47], [0.3, 0.45], [0.14, 0.56], [0.12, 0.64], [0.3, 0.52], [0.48, 0.53], [0.58, 0.66]], 0.41, N);
  ext(g, [[0.58, 0.69], [0.48, 0.58], [0.32, 0.57], [0.18, 0.68], [0.2, 0.73], [0.33, 0.62], [0.47, 0.63], [0.56, 0.73]], 0.412, Sk);
  ext(g, [[0.38, 0.8], [0.3, 0.74], [0.22, 0.75], [0.26, 0.81]], 0.414, K);
  ext(g, [[0.88, 0.8], [0.82, 0.7], [0.66, 0.66], [0.54, 0.78], [0.5, 0.92], [0.62, 0.96], [0.8, 0.88]], 0.36, Bl);
  ext(g, [[0.5, 0.42], [0.42, 0.2], [0.12, 0.16], [-0.04, 0.24], [0.08, 0.3], [0.3, 0.32]], 0.3, K);
  ext(g, [[0.5, 0.94], [0.34, 1.0], [0.1, 0.98], [-0.06, 0.9], [0.0, 0.8], [0.3, 0.86]], 0.38, Bl);
  ext(g, [[0.3, 0.9], [0.12, 0.92], [0.0, 0.86], [0.22, 0.86]], 0.39, N);
  put(g, new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.02, 8), S), 0.22, 1.0, 0);
  ext(g, [[-0.04, 0.9], [-0.1, 0.86], [-0.4, 0.86], [-0.68, 0.94], [-0.68, 0.99], [-0.44, 0.98], [-0.4, 0.93], [-0.12, 0.93]], 0.26, K);
  ext(g, [[-0.08, 0.86], [-0.12, 0.78], [-0.4, 0.76], [-0.84, 0.92], [-0.88, 0.96], [-0.68, 0.95], [-0.4, 0.87]], 0.24, W);
  ext(g, [[-0.2, 0.82], [-0.62, 0.885], [-0.62, 0.865], [-0.2, 0.8]], 0.245, N);
  ext(g, [[-0.72, 0.91], [-0.9, 0.97], [-0.8, 0.975], [-0.68, 0.945]], 0.246, Bl);

  // Parabrisas, faros, direccionales, tablero, manubrios y espejos
  ext(g, [[0.8, 0.88], [0.62, 1.05], [0.56, 1.03], [0.64, 0.92]], 0.24, M(0x2a3550, { transparent: true, opacity: 0.75, shininess: 80 }));
  [0.07, -0.07].forEach((z) => box(g, 0.03, 0.05, 0.1, B(0xfff3d0), 0.86, 0.79, z));
  box(g, 0.03, 0.025, 0.14, K, 0.84, 0.72, 0);
  [0.24, -0.24].forEach((z) => { box(g, 0.02, 0.02, 0.06, K, 0.66, 0.8, z * 0.9); box(g, 0.05, 0.03, 0.04, B(C.amber), 0.67, 0.8, z * 1.1); });
  box(g, 0.06, 0.05, 0.14, K, 0.55, 1.0, 0);
  box(g, 0.01, 0.03, 0.09, B(0x7fd1ff), 0.585, 1.005, 0);
  [0.2, -0.2].forEach((z) => {
    box(g, 0.04, 0.03, 0.12, K, 0.49, 0.97, z);
    box(g, 0.04, 0.04, 0.08, Co, 0.49, 0.97, z * 1.45);
    box(g, 0.015, 0.08, 0.015, K, 0.62, 1.0, z * 1.15);
    box(g, 0.03, 0.06, 0.11, K, 0.62, 1.05, z * 1.4);
    box(g, 0.005, 0.045, 0.09, S, 0.605, 1.05, z * 1.4);
  });

  // Calavera, porta placa, guardafango trasero
  box(g, 0.02, 0.03, 0.12, B(0xff3b30), -0.885, 0.935, 0);
  bar(g, [-0.8, 0.86], [-0.92, 0.66], 0.03, 0.06, K, 0);
  box(g, 0.012, 0.1, 0.17, M(0xd9dee8), -0.93, 0.64, 0);
  [0.09, -0.09].forEach((z) => box(g, 0.04, 0.025, 0.03, B(C.amber), -0.86, 0.8, z));
  const rh = put(g, new T.Mesh(new T.TorusGeometry(0.33, 0.03, 3, 8, 1.2), K), -0.66, 0.3, 0);
  rh.rotation.z = 0.9; rh.scale.z = 2.6;

  // Cadena y escape
  bar(g, [0.02, 0.34], [-0.66, 0.3], 0.03, 0.02, Co, -0.13);
  cylZ(g, 0.09, 0.02, 12, Co, -0.66, 0.3, -0.12);
  rod(g, [0.36, 0.3], [0.12, 0.17], 0.025, S, 0.1);
  rod(g, [0.12, 0.17], [-0.12, 0.24], 0.03, S, 0.14);
  rod(g, [-0.1, 0.25], [-0.42, 0.44], 0.06, S, 0.17);
  bar(g, [-0.14, 0.31], [-0.4, 0.46], 0.07, 0.02, K, 0.24);
  rod(g, [-0.4, 0.43], [-0.46, 0.47], 0.065, Co, 0.17);
  [0.2, -0.2].forEach((z) => { box(g, 0.06, 0.02, 0.08, S, -0.06, 0.44, z); box(g, 0.05, 0.02, 0.07, S, -0.42, 0.56, z * 0.85); });
  return g;
}
