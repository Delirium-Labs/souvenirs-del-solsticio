// Biblioteca de objetos low-poly genéricos. Todos miran hacia +Z (la cámara) y se apoyan en y = 0.
import { T, M, B, COLORS as C, put, box, cyl, cylZ, ext, bar } from '../engine/lib.js';

const shade = (color, k) => new T.Color(color).lerp(new T.Color(k > 0 ? 0xffffff : 0x000000), Math.abs(k));

/** Lavadora de carga superior (tapa de vidrio, panel trasero con perilla y pantalla). */
export function lavadora(color = 0xe9edf2) {
  const g = new T.Group();
  const W = M(color, { shininess: 30 }), G = M(shade(color, -0.25)), D = M(0x2b2f3a), S = M(C.silver, { shininess: 60 });
  box(g, 0.68, 0.86, 0.66, W, 0, 0.49, 0);
  box(g, 0.64, 0.07, 0.6, G, 0, 0.035, 0.01);
  [[0.28, 0.26], [-0.28, 0.26], [0.28, -0.26], [-0.28, -0.26]].forEach((p) => box(g, 0.06, 0.03, 0.06, D, p[0], 0.015, p[1]));
  box(g, 0.7, 0.04, 0.68, W, 0, 0.93, 0);
  box(g, 0.62, 0.035, 0.5, G, 0, 0.96, 0.06);
  box(g, 0.52, 0.04, 0.38, M(0x3a4a66, { transparent: true, opacity: 0.6, shininess: 80 }), 0, 0.965, 0.06);
  const drum = put(g, new T.Mesh(new T.TorusGeometry(0.15, 0.025, 4, 14), S), 0, 0.92, 0.06);
  drum.rotation.x = Math.PI / 2;
  box(g, 0.08, 0.02, 0.08, M(0x5a6680), 0, 0.92, 0.06);
  box(g, 0.22, 0.025, 0.04, D, 0, 0.99, 0.29);
  const bk = put(g, new T.Group(), 0, 1.03, -0.28);
  bk.rotation.x = -0.25;
  box(bk, 0.7, 0.2, 0.1, W, 0, 0, 0);
  box(bk, 0.62, 0.12, 0.012, D, 0, 0.01, 0.052);
  cylZ(bk, 0.045, 0.03, 12, S, 0.2, 0.01, 0.065);
  box(bk, 0.13, 0.04, 0.01, B(0x7fd1ff), -0.02, 0.02, 0.06);
  for (let i = 0; i < 4; i++) box(bk, 0.035, 0.022, 0.01, i === 0 ? B(C.amber) : G, -0.26 + i * 0.05, 0.0, 0.06);
  box(g, 0.6, 0.008, 0.005, G, 0, 0.82, 0.332);
  box(g, 0.6, 0.008, 0.005, G, 0, 0.12, 0.332);
  box(g, 0.005, 0.7, 0.6, G, 0.342, 0.48, 0);
  box(g, 0.005, 0.7, 0.6, G, -0.342, 0.48, 0);
  return g;
}

/** Sedán genérico de cuatro puertas. */
export function carro(color = 0xeef1f6) {
  const g = new T.Group();
  const body = M(color, { shininess: 40 }), glass = M(0x1a2236, { shininess: 80 }), K = M(C.black), S = M(C.silver, { shininess: 60 });
  ext(g, [[1.0, 0.2], [1.03, 0.34], [0.95, 0.42], [0.55, 0.45], [-0.9, 0.47], [-1.0, 0.42], [-1.02, 0.22], [-0.9, 0.16], [0.9, 0.16]], 0.84, body);
  ext(g, [[0.55, 0.45], [0.18, 0.7], [-0.42, 0.71], [-0.78, 0.47]], 0.74, body);
  ext(g, [[0.47, 0.47], [0.18, 0.66], [-0.08, 0.66], [-0.08, 0.47]], 0.745, glass);
  ext(g, [[-0.14, 0.47], [-0.14, 0.66], [-0.4, 0.67], [-0.68, 0.48]], 0.745, glass);
  bar(g, [0.53, 0.46], [0.2, 0.69], 0.02, 0.64, glass, 0);
  bar(g, [-0.44, 0.7], [-0.76, 0.49], 0.02, 0.64, glass, 0);
  [[0.62, 0.42], [0.62, -0.42], [-0.62, 0.42], [-0.62, -0.42]].forEach((p) => {
    const w = put(g, new T.Group(), p[0], 0.17, p[1]);
    w.add(new T.Mesh(new T.TorusGeometry(0.12, 0.055, 6, 14), K));
    cylZ(w, 0.1, 0.08, 10, S, 0, 0, 0);
    cylZ(w, 0.04, 0.09, 6, M(C.coal), 0, 0, 0);
  });
  [0.27, -0.27].forEach((z) => {
    box(g, 0.04, 0.06, 0.2, B(0xfff3d0), 1.02, 0.33, z);
    box(g, 0.04, 0.07, 0.22, B(0xff3b30), -1.02, 0.36, z);
    box(g, 0.08, 0.05, 0.04, K, 0.46, 0.5, z * 1.55);
  });
  box(g, 0.03, 0.08, 0.36, K, 1.035, 0.27, 0);
  box(g, 0.03, 0.06, 0.18, M(0xd9dee8), 1.04, 0.19, 0);
  box(g, 0.03, 0.06, 0.18, M(0xd9dee8), -1.04, 0.28, 0);
  box(g, 0.6, 0.006, 0.006, M(shade(color, -0.3)), 0.1, 0.36, 0.423);
  box(g, 0.6, 0.006, 0.006, M(shade(color, -0.3)), 0.1, 0.36, -0.423);
  return g;
}

/** Caja de regalo genérica (para lo que no tiene modelo). */
export function regalo(color = 0xd2463c) {
  const g = new T.Group();
  const P = M(color), R = M(0xf2b35c, { shininess: 30 });
  box(g, 0.8, 0.6, 0.8, P, 0, 0.3, 0);
  box(g, 0.86, 0.14, 0.86, P, 0, 0.66, 0);
  box(g, 0.14, 0.62, 0.82, R, 0, 0.3, 0);
  box(g, 0.82, 0.62, 0.14, R, 0, 0.3, 0);
  box(g, 0.16, 0.16, 0.88, R, 0, 0.66, 0);
  box(g, 0.88, 0.16, 0.16, R, 0, 0.66, 0);
  [0.6, -0.6].forEach((r) => { const t = put(g, new T.Mesh(new T.TorusGeometry(0.12, 0.04, 4, 8), R), r * 0.2, 0.82, 0); t.rotation.y = r; t.rotation.z = r * 0.5; });
  return g;
}
