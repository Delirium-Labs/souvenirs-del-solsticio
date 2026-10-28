// 1 · Entrada: la cámara avanza de noche hacia la tienda nevada.
import { T, M, B, box, put, cyl, pine, snowfall, COLORS as C } from '../engine/lib.js';
import { setHud } from '../ui/hud.js';

export async function entrada(ctx) {
  const s = new T.Scene();
  s.background = new T.Color(0x0a0e24);
  s.fog = new T.Fog(0x0a0e24, 16, 62);
  const cam = new T.PerspectiveCamera(50, 4 / 3, 0.1, 100);
  const SNOW = M(C.snow), WOOD = M(C.woodMid), DARK = M(0x1b1b22);
  const mk = (geo, m, x, y, z) => put(s, new T.Mesh(geo, m), x, y, z);

  // Terreno con lomas lejos del centro
  const gg = new T.PlaneGeometry(90, 90, 18, 18);
  const gp = gg.attributes.position;
  for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), y = gp.getY(i); if (Math.abs(x) > 7 || Math.abs(y) > 8) gp.setZ(i, Math.random() * 0.9); }
  gg.computeVertexNormals();
  mk(gg, M(0xb8c3dd)).rotation.x = -Math.PI / 2;

  [[-24, -30, 8], [-9, -34, 10], [8, -32, 9], [25, -29, 8]].forEach((a) => {
    mk(new T.ConeGeometry(a[2] * 0.9, a[2], 5), M(0x1a2150), a[0], a[2] / 2, a[1]);
    mk(new T.ConeGeometry(a[2] * 0.27, a[2] * 0.3, 5), M(0xc9d2e6), a[0], a[2] * 0.85, a[1]);
  });

  // La tienda
  box(s, 6, 3.5, 4, M(0x3a2b52), 0, 1.75, 0);
  box(s, 6.1, 0.3, 4.1, M(0x2a1f3d), 0, 0.15, 0);
  mk(new T.ConeGeometry(4.4, 1.8, 4), M(0x241a38), 0, 4.4, 0).rotation.y = Math.PI / 4;
  mk(new T.ConeGeometry(2.5, 1.0, 4), SNOW, 0, 4.85, 0).rotation.y = Math.PI / 4;
  box(s, 0.6, 1.2, 0.6, M(0x241a38), 1.6, 4.6, -0.6);
  box(s, 0.72, 0.14, 0.72, SNOW, 1.6, 5.25, -0.6);

  [-1.8, 1.8].forEach((x) => {
    box(s, 1.2, 1, 0.06, B(C.amber), x, 1.8, 2.02);
    box(s, 0.06, 1, 0.08, M(0x3a2b52), x, 1.8, 2.04);
    box(s, 1.2, 0.06, 0.08, M(0x3a2b52), x, 1.8, 2.04);
    box(s, 1.4, 0.08, 0.08, WOOD, x, 2.34, 2.06);
    box(s, 1.3, 0.2, 0.28, WOOD, x, 1.2, 2.16);
    box(s, 1.32, 0.08, 0.3, SNOW, x, 1.33, 2.16);
    mk(new T.PlaneGeometry(1.4, 1.6), B(C.amber, { transparent: true, opacity: 0.16 }), x, 0.03, 2.9).rotation.x = -Math.PI / 2;
  });

  // Puerta, corona, escalones, toldo y faroles
  box(s, 0.9, 1.9, 0.06, B(0xc7832e), 0, 1.05, 2.02);
  box(s, 0.6, 0.7, 0.08, B(C.amber), 0, 1.5, 2.03);
  mk(new T.TorusGeometry(0.2, 0.06, 5, 10), M(C.pine), 0, 1.5, 2.1);
  box(s, 0.14, 0.1, 0.04, M(C.red), 0, 1.3, 2.13);
  box(s, 0.05, 0.05, 0.05, B(0x1b1b22), 0.3, 1.0, 2.07);
  box(s, 1.8, 0.16, 0.8, M(C.wood), 0, 0.08, 2.4);
  box(s, 1.5, 0.12, 0.5, M(C.wood), 0, 0.22, 2.25);
  box(s, 1.7, 0.06, 0.8, M(C.red), 0, 2.32, 2.35).rotation.x = 0.35;
  [-0.6, -0.2, 0.2, 0.6].forEach((x) => { box(s, 0.2, 0.065, 0.8, M(0xeef1f6), x, 2.33, 2.35).rotation.x = 0.35; });
  [-0.78, 0.78].forEach((x) => {
    box(s, 0.2, 0.3, 0.2, B(C.amber), x, 1.95, 2.14);
    box(s, 0.26, 0.06, 0.26, DARK, x, 2.13, 2.14);
    const lp = new T.PointLight(C.amber, 0.7, 4); lp.position.set(x, 1.9, 2.5); s.add(lp);
  });

  // Letrero, focos de colores y carámbanos
  box(s, 4.2, 0.7, 0.14, WOOD, 0, 3.05, 2.08);
  for (let i = 0; i < 16; i++) box(s, 0.14, 0.2 + (i % 3) * 0.04, 0.04, B(C.amber), -1.65 + i * 0.22, 3.08, 2.17);
  const bulbColors = [C.red, C.amber, 0x3e8e5a, 0x4a78e8];
  const bulbs = [];
  for (let i = 0; i < 16; i++) bulbs.push(box(s, 0.11, 0.13, 0.11, B(bulbColors[i % 4]), -3.0 + i * 0.4, 3.42 - (i % 2) * 0.07, 3.12));
  for (let i = 0; i < 12; i++) mk(new T.ConeGeometry(0.05, 0.22 + (i % 3) * 0.08, 4), SNOW, -2.8 + i * 0.5, 3.3, 3.1).rotation.x = Math.PI;

  // Letrero colgante con un globo
  box(s, 0.7, 0.05, 0.05, DARK, 3.3, 2.85, 1.6);
  box(s, 0.6, 0.5, 0.06, WOOD, 3.45, 2.5, 1.6);
  mk(new T.IcosahedronGeometry(0.13, 1), new T.MeshPhongMaterial({ color: 0xc9d2e6, transparent: true, opacity: 0.6, flatShading: true }), 3.45, 2.52, 1.66);

  // Camino de piedras
  for (let i = 0; i < 7; i++) box(s, 0.75, 0.07, 0.46, M(0x9faac8), Math.sin(i * 1.3) * 0.12, 0.04, 3.1 + i * 0.75);

  // Muñeco de nieve
  const sm = (y, r) => mk(new T.IcosahedronGeometry(r, 1), SNOW, -3.6, y, 3.6);
  sm(0.45, 0.45); sm(1.1, 0.33); sm(1.58, 0.23);
  mk(new T.ConeGeometry(0.04, 0.22, 5), M(0xe8742a), -3.6, 1.58, 3.88).rotation.x = Math.PI / 2;
  cyl(s, 0.15, 0.15, 0.22, 8, DARK, -3.6, 1.86, 3.6);
  cyl(s, 0.25, 0.25, 0.03, 8, DARK, -3.6, 1.75, 3.6);
  mk(new T.TorusGeometry(0.24, 0.06, 4, 8), M(C.red), -3.6, 1.36, 3.6).rotation.x = Math.PI / 2;
  [1.0, 1.15].forEach((y) => box(s, 0.05, 0.05, 0.05, DARK, -3.6, y, 3.93));
  box(s, 0.6, 0.04, 0.04, M(C.woodDark), -4.05, 1.2, 3.6).rotation.z = 0.5;
  box(s, 0.6, 0.04, 0.04, M(C.woodDark), -3.15, 1.2, 3.6).rotation.z = -0.5;

  // Banca
  box(s, 1.3, 0.08, 0.42, WOOD, 3.8, 0.48, 3.3);
  box(s, 1.3, 0.06, 0.38, SNOW, 3.8, 0.55, 3.3);
  box(s, 1.3, 0.32, 0.06, WOOD, 3.8, 0.8, 3.1);
  [[3.25, 3.45], [4.35, 3.45], [3.25, 3.15], [4.35, 3.15]].forEach((p) => box(s, 0.06, 0.45, 0.06, DARK, p[0], 0.22, p[1]));

  // Farol de calle
  cyl(s, 0.06, 0.09, 2.7, 6, DARK, -1.7, 1.35, 5.0);
  box(s, 0.28, 0.34, 0.28, B(C.amber), -1.7, 2.8, 5.0);
  mk(new T.ConeGeometry(0.26, 0.2, 4), DARK, -1.7, 3.07, 5.0).rotation.y = Math.PI / 4;
  const sl = new T.PointLight(C.amber, 1.1, 7); sl.position.set(-1.7, 2.6, 5.0); s.add(sl);

  // Buzón
  box(s, 0.08, 1.0, 0.08, WOOD, 2.6, 0.5, 5.4);
  box(s, 0.4, 0.28, 0.24, M(C.red), 2.6, 1.1, 5.4);
  box(s, 0.42, 0.06, 0.26, SNOW, 2.6, 1.27, 5.4);

  // Cercas
  const fence = (x0, x1) => {
    for (let x = x0; x <= x1 + 0.01; x += 0.6) { box(s, 0.1, 0.75, 0.1, WOOD, x, 0.37, 6.2); box(s, 0.14, 0.08, 0.14, SNOW, x, 0.78, 6.2); }
    [0.3, 0.6].forEach((y) => box(s, x1 - x0, 0.07, 0.05, WOOD, (x0 + x1) / 2, y, 6.2));
  };
  fence(-7.2, -2.4); fence(2.4, 7.2);

  [[-3.0, 2.0], [3.0, 2.0], [-3.0, -2.0], [3.0, -2.0]].forEach((p) => { mk(new T.IcosahedronGeometry(0.6, 0), SNOW, p[0], 0.1, p[1]).scale.set(1.4, 0.4, 1.4); });

  pine(s, -6.5, 1, 1); pine(s, 7, 0, 1.1); pine(s, -9.5, -4, 1.3); pine(s, 10, -6, 1.4); pine(s, -4, -9, 1.2); pine(s, 4, -10, 1.1); pine(s, -12, 3, 1.2); pine(s, 12.5, 2, 1.0);

  // Humo, luna, estrellas y nieve
  const smoke = [];
  for (let i = 0; i < 6; i++) smoke.push(mk(new T.IcosahedronGeometry(0.22, 0), new T.MeshPhongMaterial({ color: 0x9faac8, transparent: true, opacity: 0.5, flatShading: true }), 1.6, 5.4, -0.6));
  mk(new T.IcosahedronGeometry(1.6, 0), B(0xf3eedd, { fog: false }), -38, 15, -30);
  const stg = new T.BufferGeometry();
  const sta = new Float32Array(160 * 3);
  for (let i = 0; i < 160; i++) { sta[i * 3] = (Math.random() - 0.5) * 90; sta[i * 3 + 1] = 9 + Math.random() * 26; sta[i * 3 + 2] = -32 - Math.random() * 10; }
  stg.setAttribute('position', new T.BufferAttribute(sta, 3));
  s.add(new T.Points(stg, new T.PointsMaterial({ color: 0xe6ecf7, size: 2, sizeAttenuation: false, fog: false })));
  const snow = snowfall(450, 30, 12, 24);
  s.add(snow.points);

  s.add(new T.AmbientLight(0x6a76b8, 0.6));
  const dl = new T.DirectionalLight(0xc9d2ff, 0.5); dl.position.set(6, 10, -4); s.add(dl);
  const pl = new T.PointLight(C.amber, 1.6, 10); pl.position.set(0, 1.8, 3.6); s.add(pl);

  setHud(ctx.hud, `
    <div class="title-block passive">
      <p class="title-kicker">DELIRIUM LABS PRESENTA</p>
      <h1 class="title-main" style="margin:0;font-weight:400">SOUVENIRS DEL SOLSTICIO</h1>
      <p class="title-sub">DE INVIERNO</p>
    </div>
    <button type="button" class="btn enter blink" id="entrar">PULSA PARA ENTRAR</button>`);
  ctx.hud.querySelector('#entrar').addEventListener('click', () => ctx.go('vitrina'));

  return {
    scene: s,
    camera: cam,
    update(t) {
      const e = 1 - Math.pow(1 - Math.min(t / 7, 1), 3);
      cam.position.set(-5 + e * 11 + Math.sin(t * 0.25) * 0.3, 4.6 - e * 1.8, 24 - e * 11);
      cam.lookAt(0, 2.5 - e * 0.4, 1);
      smoke.forEach((p, i) => {
        const ph = (t * 0.35 + i / smoke.length) % 1;
        p.position.set(1.6 + Math.sin(ph * 6 + i) * 0.15 - ph * 0.5, 5.4 + ph * 2.4, -0.6);
        p.scale.setScalar(0.6 + ph * 1.6);
        p.material.opacity = 0.55 * (1 - ph);
      });
      bulbs.forEach((b, i) => { b.visible = ((Math.floor(t * 2) + i) % 5) !== 0; });
      snow.tick(t);
    },
    onPointer(type) { if (type === 'tap') ctx.go('vitrina'); },
    onKey(k) { if (k === 'enter' || k === ' ' || k === 'a') ctx.go('vitrina'); },
  };
}
