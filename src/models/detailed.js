// Objetos detallados de la lista del Solsticio. Son diseños propios por tipo de objeto (sin logos ni réplicas de marca).
// Los vehículos miran hacia +X (perfil); el resto mira hacia +Z. Todos se apoyan en y = 0.
import { T, M, B, COLORS as C, put, box, cyl, cylZ, ext, bar } from '../engine/lib.js';

const shade = (color, k) => new T.Color(color).lerp(new T.Color(k > 0 ? 0xffffff : 0x000000), Math.abs(k));

/** Puntos de un rectángulo con esquinas redondeadas (centrado en el origen). */
function roundRect(w, h, r, seg = 3) {
  const pts = [];
  const corners = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, Math.PI / 2], [-w / 2 + r, -h / 2 + r, Math.PI], [w / 2 - r, -h / 2 + r, Math.PI * 1.5]];
  corners.forEach(([cx, cy, a0]) => { for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * (Math.PI / 2); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } });
  return pts;
}

/** Placa extruida con esquinas redondeadas, de frente a +Z. */
function plate(g, w, h, r, depth, m, x = 0, y = 0, z = 0) {
  const o = ext(g, roundRect(w, h, r), depth, m);
  o.position.set(x, y, z);
  return o;
}

/** Rueda de auto: llanta, rin de rayos y caliper. */
function carWheel(g, x, z, r, rimColor, spokes = 5) {
  const w = put(g, new T.Group(), x, r, z);
  const side = Math.sign(z) || 1;
  w.add(new T.Mesh(new T.TorusGeometry(r * 0.74, r * 0.3, 6, 16), M(C.black)));
  const rim = M(rimColor, { shininess: 60 });
  cylZ(w, r * 0.62, 0.06, 14, M(0x22242a), 0, 0, 0);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    [-0.09, 0.09].forEach((da) => {
      const sp = put(w, new T.Mesh(new T.BoxGeometry(r * 0.56, r * 0.07, 0.03), rim), Math.cos(a + da) * r * 0.3, Math.sin(a + da) * r * 0.3, side * 0.035);
      sp.rotation.z = a + da;
    });
  }
  put(w, new T.Mesh(new T.TorusGeometry(r * 0.6, r * 0.05, 3, 16), rim), 0, 0, side * 0.035);
  cylZ(w, r * 0.12, 0.08, 8, rim, 0, 0, side * 0.03);
  box(w, r * 0.22, r * 0.34, 0.05, M(C.red), r * 0.34, r * 0.18, side * 0.01);
  return w;
}

/** Sedán ejecutivo de lujo: largo y bajo, con molduras cromadas y rines de doble rayo. */
export function sedan(color = 0xeef1f6) {
  const g = new T.Group();
  const body = M(color, { shininess: 60, specular: 0x666666 }), dark = M(shade(color, -0.18)), glass = M(0x161d2e, { shininess: 90 });
  const chrome = M(0xd9dee8, { shininess: 90, specular: 0xffffff }), K = M(C.black);
  ext(g, [[1.1, 0.2], [1.13, 0.33], [1.06, 0.42], [0.64, 0.47], [-0.86, 0.5], [-1.08, 0.46], [-1.11, 0.27], [-1.02, 0.17], [1.02, 0.17]], 0.88, body);
  ext(g, [[0.62, 0.47], [0.24, 0.71], [-0.42, 0.73], [-0.82, 0.5]], 0.76, body);
  ext(g, [[0.54, 0.49], [0.24, 0.685], [-0.1, 0.695], [-0.1, 0.49]], 0.765, glass);
  ext(g, [[-0.16, 0.49], [-0.16, 0.695], [-0.4, 0.705], [-0.74, 0.51]], 0.765, glass);
  bar(g, [0.6, 0.48], [0.25, 0.7], 0.022, 0.66, glass, 0);
  bar(g, [-0.44, 0.72], [-0.8, 0.51], 0.022, 0.66, glass, 0);
  [0.384, -0.384].forEach((z) => {
    box(g, 1.3, 0.012, 0.006, chrome, -0.1, 0.488, z);
    bar(g, [0.54, 0.49], [0.24, 0.687], 0.01, 0.006, chrome, z);
    bar(g, [0.24, 0.69], [-0.4, 0.707], 0.01, 0.006, chrome, z);
    box(g, 0.01, 0.2, 0.006, K, -0.13, 0.6, z);
  });
  [0.442, -0.442].forEach((z) => {
    box(g, 1.9, 0.012, 0.006, dark, 0, 0.4, z);
    box(g, 1.5, 0.05, 0.01, K, -0.05, 0.19, z);
    [0.15, -0.38].forEach((x) => box(g, 0.08, 0.018, 0.012, chrome, x, 0.43, z));
    box(g, 0.1, 0.05, 0.05, body, 0.5, 0.52, z * 1.1);
  });
  box(g, 0.025, 0.06, 0.52, K, 1.125, 0.27, 0);
  box(g, 0.026, 0.012, 0.54, chrome, 1.126, 0.305, 0);
  [0.31, -0.31].forEach((z) => {
    box(g, 0.03, 0.035, 0.22, B(0xf4f7ff), 1.1, 0.365, z);
    box(g, 0.03, 0.012, 0.2, B(C.amber), 1.105, 0.34, z);
    box(g, 0.03, 0.05, 0.22, B(0xff2a2a), -1.1, 0.4, z * 1.02);
    box(g, 0.04, 0.03, 0.1, B(0xff2a2a), -1.07, 0.4, z * 1.32);
    cylZ(g, 0.035, 0.1, 8, chrome, -1.1, 0.2, z * 0.6).rotation.set(0, 0, Math.PI / 2);
  });
  box(g, 0.02, 0.012, 0.5, chrome, -1.11, 0.36, 0);
  box(g, 0.1, 0.04, 0.03, K, -0.4, 0.75, 0);
  [[0.7, 0.44], [0.7, -0.44], [-0.7, 0.44], [-0.7, -0.44]].forEach((p) => carWheel(g, p[0], p[1], 0.18, 0xc9cfd8, 5));
  return g;
}

/** Sedán deportivo compacto: guardafangos anchos, toma de aire en el cofre y alerón alto. */
export function deportivo(color = 0x16161c) {
  const g = new T.Group();
  const body = M(color, { shininess: 70, specular: 0x555555 }), glass = M(0x101522, { shininess: 90 }), K = M(0x0b0b0e), S = M(C.silver, { shininess: 70 });
  ext(g, [[0.95, 0.2], [0.98, 0.35], [0.9, 0.46], [0.42, 0.5], [-0.78, 0.53], [-0.95, 0.49], [-0.98, 0.25], [-0.88, 0.16], [0.88, 0.16]], 0.86, body);
  [0.6, -0.6].forEach((x) => box(g, 0.56, 0.16, 0.95, body, x, 0.36, 0));
  ext(g, [[0.42, 0.5], [0.12, 0.77], [-0.42, 0.78], [-0.7, 0.53]], 0.76, body);
  ext(g, [[0.36, 0.52], [0.13, 0.74], [-0.14, 0.75], [-0.14, 0.52]], 0.765, glass);
  ext(g, [[-0.2, 0.52], [-0.2, 0.75], [-0.4, 0.755], [-0.64, 0.54]], 0.765, glass);
  bar(g, [0.41, 0.51], [0.13, 0.765], 0.022, 0.66, glass, 0);
  bar(g, [-0.44, 0.77], [-0.69, 0.54], 0.022, 0.66, glass, 0);
  const scoop = put(g, new T.Group(), 0.62, 0.48, 0);
  scoop.rotation.z = -0.08;
  box(scoop, 0.34, 0.07, 0.32, body, 0, 0.03, 0);
  box(scoop, 0.01, 0.045, 0.26, K, 0.17, 0.03, 0);
  [0.27, -0.27].forEach((z) => {
    bar(g, [-0.82, 0.52], [-0.9, 0.7], 0.03, 0.04, body, z);
    box(g, 0.035, 0.06, 0.22, B(0xf4f7ff), 0.965, 0.37, z * 1.15);
    cylZ(g, 0.035, 0.02, 10, B(0xfff3d0), 0.985, 0.24, z * 1.25).rotation.set(0, 0, Math.PI / 2);
    box(g, 0.03, 0.06, 0.2, B(0xff2a2a), -0.97, 0.4, z * 1.15);
    box(g, 0.1, 0.05, 0.05, body, 0.36, 0.55, z * 1.7);
  });
  const wing = box(g, 0.24, 0.025, 0.86, body, -0.9, 0.72, 0);
  wing.rotation.z = 0.08;
  [0.43, -0.43].forEach((z) => box(g, 0.24, 0.08, 0.01, body, -0.9, 0.72, z));
  box(g, 0.03, 0.08, 0.5, K, 0.985, 0.25, 0);
  [0.47, -0.47].forEach((z) => box(g, 1.0, 0.05, 0.01, K, -0.05, 0.19, z));
  cylZ(g, 0.05, 0.12, 10, S, -0.98, 0.2, 0.22).rotation.set(0, 0, Math.PI / 2);
  box(g, 0.08, 0.035, 0.03, K, -0.35, 0.8, 0);
  [[0.6, 0.45], [0.6, -0.45], [-0.6, 0.45], [-0.6, -0.45]].forEach((p) => carWheel(g, p[0], p[1], 0.19, 0x4a4d55, 6));
  return g;
}

/** Celular con marco redondeado, pantalla de inicio genérica y módulo de cámaras. */
export function celular(color = 0x2f3a4f) {
  const g = new T.Group();
  const frame = M(color, { shininess: 70, specular: 0x888888 });
  const ph = put(g, new T.Group(), 0, 0.5, 0);
  ph.rotation.x = -0.1;
  plate(ph, 0.4, 0.84, 0.06, 0.05, frame);
  plate(ph, 0.37, 0.8, 0.05, 0.004, B(0x0d1430), 0, 0, 0.026);
  const wall = [[0x1b2a6b, 0.3], [0x2f5bd3, 0.12], [0x4a78e8, -0.08], [0xd98a9a, -0.26]];
  wall.forEach(([c, y]) => box(ph, 0.36, 0.2, 0.002, B(c), 0, y, 0.0285));
  cylZ(ph, 0.018, 0.004, 10, B(0x000000), 0, 0.37, 0.031);
  const icons = [0xd2463c, 0xf2b35c, 0x3e8e5a, 0x4a78e8, 0x9faac8, 0xe6ecf7, 0x7fd1ff, 0xd98a9a];
  for (let i = 0; i < 12; i++) plate(ph, 0.06, 0.06, 0.015, 0.003, B(icons[(i * 3) % icons.length]), -0.12 + (i % 4) * 0.08, 0.26 - Math.floor(i / 4) * 0.1, 0.031);
  plate(ph, 0.33, 0.09, 0.035, 0.003, B(0x3a4a7a), 0, -0.32, 0.031);
  for (let i = 0; i < 4; i++) plate(ph, 0.06, 0.06, 0.015, 0.003, B(icons[(i + 2) % icons.length]), -0.12 + i * 0.08, -0.32, 0.033);
  box(ph, 0.012, 0.12, 0.03, frame, 0.205, 0.18, 0);
  [0.22, 0.12, 0.02].forEach((y) => box(ph, 0.012, y === 0.22 ? 0.04 : 0.07, 0.03, frame, -0.205, y, 0));
  plate(ph, 0.17, 0.17, 0.04, 0.016, M(shade(color, 0.12), { shininess: 80 }), -0.085, 0.29, -0.033);
  [[-0.12, 0.33], [-0.05, 0.25]].forEach(([x, y]) => {
    cylZ(ph, 0.032, 0.014, 12, M(0x1a1a20), x, y, -0.046);
    cylZ(ph, 0.02, 0.006, 12, B(0x202a55), x, y, -0.054);
  });
  cylZ(ph, 0.012, 0.006, 8, B(0xfff3d0), -0.04, 0.34, -0.044);
  box(g, 0.5, 0.06, 0.32, M(0x2b2f3a), 0, 0.03, 0.02);
  box(g, 0.5, 0.14, 0.04, M(0x2b2f3a), 0, 0.12, 0.15);
  return g;
}

/** Cámara mirrorless full frame: empuñadura profunda, visor, diales y lente con anillos. */
export function camara(color = 0x1f2026) {
  const g = new T.Group();
  const body = M(color, { shininess: 25 }), K = M(0x0d0d10), S = M(C.silver, { shininess: 80 }), D = M(0x3a3d46);
  box(g, 0.92, 0.54, 0.32, body, 0, 0.33, 0);
  box(g, 0.86, 0.05, 0.3, M(shade(color, 0.08)), 0, 0.62, 0);
  ext(g, [[0.2, 0.0], [0.14, 0.2], [-0.14, 0.2], [-0.2, 0.0]], 0.32, body).position.set(-0.08, 0.64, -0.01);
  box(g, 0.2, 0.025, 0.1, S, -0.08, 0.85, -0.01);
  box(g, 0.24, 0.14, 0.08, K, -0.08, 0.74, -0.2);
  plate(g, 0.26, 0.62, 0.08, 0.5, K, 0.36, 0.32, 0.07);
  for (let i = 0; i < 6; i++) box(g, 0.2, 0.01, 0.005, D, 0.36, 0.12 + i * 0.07, 0.322);
  const dial = (x, r, z) => {
    cyl(g, r, r, 0.05, 14, D, x, 0.67, z);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; box(g, 0.012, 0.045, 0.012, K, x + Math.cos(a) * r, 0.67, z + Math.sin(a) * r); }
  };
  dial(0.24, 0.07, -0.02); dial(-0.33, 0.06, 0.0);
  cyl(g, 0.045, 0.045, 0.03, 12, S, 0.36, 0.665, 0.18);
  cyl(g, 0.028, 0.028, 0.04, 10, S, 0.36, 0.69, 0.18);
  [0.47, -0.47].forEach((x) => box(g, 0.03, 0.06, 0.05, S, x, 0.56, 0));
  const lens = put(g, new T.Group(), -0.07, 0.32, 0.16);
  cylZ(lens, 0.2, 0.04, 16, S, 0, 0, 0.02);
  cylZ(lens, 0.19, 0.16, 16, K, 0, 0, 0.12);
  cylZ(lens, 0.2, 0.1, 16, D, 0, 0, 0.24);
  for (let i = 0; i < 6; i++) put(lens, new T.Mesh(new T.TorusGeometry(0.2, 0.008, 3, 16), K), 0, 0, 0.2 + i * 0.016);
  cylZ(lens, 0.195, 0.08, 16, K, 0, 0, 0.33);
  put(lens, new T.Mesh(new T.TorusGeometry(0.19, 0.006, 3, 16), M(C.red)), 0, 0, 0.372);
  cylZ(lens, 0.16, 0.01, 16, B(0x16224a), 0, 0, 0.375);
  cylZ(lens, 0.09, 0.012, 12, B(0x2a3a78), 0, 0, 0.377);
  box(lens, 0.05, 0.05, 0.004, B(0xbfd0ff), -0.06, 0.06, 0.384);
  box(g, 0.05, 0.05, 0.02, B(C.amber), 0.18, 0.5, 0.165);
  return g;
}

/** Cámara de bolsillo con estabilizador de tres ejes y pantalla en el mango. */
export function gimbal(color = 0x2b2d33) {
  const g = new T.Group();
  const body = M(color, { shininess: 35 }), K = M(0x0d0d10), D = M(0x45474f);
  plate(g, 0.26, 0.82, 0.1, 0.18, body, 0, 0.41, 0);
  plate(g, 0.2, 0.2, 0.03, 0.006, B(0x0e1638), 0, 0.68, 0.092);
  box(g, 0.16, 0.06, 0.002, B(0x4a78e8), 0, 0.7, 0.096);
  box(g, 0.1, 0.02, 0.002, B(0xe6ecf7), -0.02, 0.62, 0.096);
  cylZ(g, 0.035, 0.03, 12, D, 0, 0.47, 0.095);
  cylZ(g, 0.018, 0.03, 10, K, 0, 0.47, 0.11);
  cylZ(g, 0.028, 0.02, 12, M(C.red), -0.05, 0.36, 0.095);
  cylZ(g, 0.022, 0.02, 10, D, 0.05, 0.36, 0.095);
  for (let i = 0; i < 4; i++) box(g, 0.14, 0.006, 0.004, D, 0, 0.14 + i * 0.025, 0.092);
  cyl(g, 0.07, 0.09, 0.08, 10, body, 0, 0.86, 0);
  const yoke = put(g, new T.Group(), 0, 0.92, 0);
  const arc = put(yoke, new T.Mesh(new T.TorusGeometry(0.11, 0.025, 4, 12, Math.PI), body), 0, 0.11, 0);
  arc.rotation.y = Math.PI / 2;
  arc.rotation.z = Math.PI;
  const head = put(yoke, new T.Group(), 0, 0.12, 0.0);
  box(head, 0.15, 0.13, 0.15, K, 0, 0, 0);
  cylZ(head, 0.05, 0.04, 14, D, 0, 0, 0.09);
  cylZ(head, 0.038, 0.01, 14, B(0x1c2a55), 0, 0, 0.112);
  box(head, 0.02, 0.02, 0.003, B(0xbfd0ff), -0.012, 0.012, 0.118);
  [0.1, -0.1].forEach((x) => cyl(head, 0.03, 0.03, 0.04, 10, body, x, 0, 0).rotation.z = Math.PI / 2);
  return g;
}

/** Laptop gamer delgada: teclado RGB, rejillas, bisagra y barra de luz en la tapa. */
export function laptop(color = 0x2a2c34) {
  const g = new T.Group();
  const body = M(color, { shininess: 45, specular: 0x444444 }), K = M(0x0f0f13), D = M(0x3a3d46);
  plate(g, 1.36, 0.92, 0.05, 0.045, body).rotation.x = -Math.PI / 2;
  g.children[g.children.length - 1].position.y = 0.0225;
  box(g, 1.2, 0.006, 0.42, K, 0, 0.048, -0.12);
  for (let r = 0; r < 5; r++) {
    for (let i = 0; i < 14; i++) {
      const hue = (i / 14 + r * 0.04) % 1;
      const keyC = new T.Color().setHSL(hue, 0.85, 0.55);
      box(g, 0.068, 0.012, 0.062, M(0x22242a), -0.52 + i * 0.08, 0.055, -0.3 + r * 0.075);
      box(g, 0.05, 0.002, 0.008, B(keyC), -0.52 + i * 0.08, 0.062, -0.3 + r * 0.075 + 0.024);
    }
  }
  box(g, 0.46, 0.012, 0.062, M(0x22242a), 0, 0.055, 0.075);
  plate(g, 0.42, 0.22, 0.02, 0.004, M(shade(color, 0.14), { shininess: 60 })).rotation.x = -Math.PI / 2;
  g.children[g.children.length - 1].position.set(0, 0.047, 0.26);
  [-0.58, 0.58].forEach((x) => { for (let i = 0; i < 6; i++) for (let k = 0; k < 3; k++) box(g, 0.02, 0.003, 0.02, K, x + (k - 1) * 0.03, 0.047, -0.3 + i * 0.06); });
  cyl(g, 0.028, 0.028, 1.1, 10, D, 0, 0.05, -0.45).rotation.z = Math.PI / 2;
  const lid = put(g, new T.Group(), 0, 0.05, -0.46);
  lid.rotation.x = -0.22;
  plate(lid, 1.36, 0.86, 0.05, 0.03, body, 0, 0.43, 0);
  plate(lid, 1.28, 0.78, 0.03, 0.004, K, 0, 0.44, 0.016);
  const sky = [[0x1b2a6b, 0.7], [0x2f5bd3, 0.6], [0xd98a9a, 0.5]];
  sky.forEach(([c, y]) => box(lid, 1.22, 0.11, 0.002, B(c), 0, y, 0.0185));
  ext(lid, [[-0.61, 0.1], [-0.3, 0.42], [-0.05, 0.22], [0.25, 0.48], [0.61, 0.18], [0.61, 0.08], [-0.61, 0.08]], 0.002, B(0x161c42)).position.z = 0.019;
  box(lid, 1.22, 0.06, 0.002, B(0x0a0e24), 0, 0.11, 0.0195);
  cylZ(lid, 0.05, 0.002, 10, B(0xf3eedd), 0.4, 0.68, 0.02);
  box(lid, 0.9, 0.012, 0.004, B(0xe6ecf7), 0, 0.2, -0.016);
  box(lid, 0.012, 0.012, 0.004, B(C.amber), 0.5, 0.2, -0.016);
  return g;
}
