// 3 · Globo en la mano: el globo gira (o lo giras arrastrando) y la etiqueta de papel cuelga a la derecha.
import { T, M, box, put, tex, fit, wrap, FONT_TITLE, FONT_TEXT, COLORS as C } from '../engine/lib.js';
import { globeFor } from '../models/index.js';
import { dias, escarchado, diasParaDescongelar, nieve, faltan, dinero } from '../data/rules.js';
import { setHud, modalDeseo, modalAcceso } from '../ui/hud.js';

export async function globo(ctx, params = {}) {
  const { store } = ctx;
  const state = await store.get();
  const now = store.now();
  const d = state.deseos.find((x) => x.id === params.id);
  if (!d) throw new Error('Ese deseo ya no está en la vitrina.');
  const remoto = state.acceso?.configurado === true;
  const dueno = !remoto || state.acceso.dueno || state.vitrinaPersonal === true;
  const frost = escarchado(d, now);
  const nd = dias(d.creado, now);

  const s = new T.Scene();
  s.background = new T.Color(0x0a0e24);
  s.fog = new T.Fog(0x0a0e24, 5, 14);
  const cam = new T.PerspectiveCamera(40, 4 / 3, 0.1, 100);

  // Mostrador y la tienda desenfocada al fondo
  box(s, 9, 0.12, 3.2, M(C.woodMid), 0, -1.36, 0.2);
  box(s, 9, 0.04, 3.22, M(C.woodDark), 0, -1.44, 0.2);
  for (let i = 0; i < 8; i++) box(s, 0.9, 5, 0.1, M(i % 2 ? 0x1f1838 : 0x241a40), -3.6 + i * 1.0, 1.0, -3.6);
  [0.3, 1.6].forEach((y) => box(s, 8, 0.08, 0.5, M(C.woodDark), 0, y, -3.3));
  for (let i = 0; i < 9; i++) {
    const gx = -3.4 + i * 0.85, gy = i % 2 ? 0.55 : 1.85;
    put(s, new T.Mesh(new T.SphereGeometry(0.2, 8, 6), new T.MeshPhongMaterial({ color: 0xc9d2e6, transparent: true, opacity: 0.25, flatShading: true })), gx, gy, -3.25);
    box(s, 0.3, 0.1, 0.3, M(C.woodMid), gx, gy - 0.18, -3.25);
  }

  const gl = globeFor(d, { sel: !frost, frost, pile: nieve(d, now), flake: 3 });
  gl.g.scale.setScalar(1.7);
  gl.g.position.set(-0.85, -1.22, 0);
  s.add(gl.g);

  // Etiqueta de precio: papel 3D con hilo
  const falta = faltan(d, state.ahorro.monto);
  const tx = tex(128, 166, (c, w, h) => {
    c.fillStyle = '#EFE6D2';
    c.beginPath(); c.moveTo(16, 0); c.lineTo(w - 16, 0); c.lineTo(w, 16); c.lineTo(w, h); c.lineTo(0, h); c.lineTo(0, 16); c.closePath(); c.fill();
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.arc(64, 11, 4, 0, 6.3); c.fill();
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = '#C7832E'; c.lineWidth = 2; c.beginPath(); c.arc(64, 11, 6, 0, 6.3); c.stroke();
    c.fillStyle = '#1B1B22';
    c.font = FONT_TITLE.replace('{}', '8px');
    wrap(c, d.nombre.toUpperCase(), w - 16, 2).forEach((line, i) => c.fillText(line, 8, 24 + i * 12));
    c.fillStyle = '#9FAAC8'; for (let x = 8; x < w - 8; x += 6) c.fillRect(x, 50, 3, 1);
    c.fillStyle = '#1B1B22'; const price = dinero(d.precio); fit(c, price, FONT_TEXT, 44, w - 16); c.fillText(price, 8, 54);
    c.fillStyle = '#3B3A40';
    const l1 = `${d.categoria} · prioridad ${d.prioridad.toLowerCase()}`;
    fit(c, l1, FONT_TEXT, 17, w - 16); c.fillText(l1, 8, 96);
    const l2 = frost ? `Escarchado: faltan ${diasParaDescongelar(d, now)} días` : `${nd} días en vitrina`;
    c.fillStyle = frost ? '#2F5BD3' : '#3B3A40'; fit(c, l2, FONT_TEXT, 17, w - 16); c.fillText(l2, 8, 111);
    const l3 = dueno ? (falta > 0 ? `Te faltan ${dinero(falta)}` : '¡Te alcanza con el ahorro!') : 'Ahorro privado';
    c.fillStyle = !dueno ? '#6E6658' : falta > 0 ? '#D2463C' : '#3E8E5A'; fit(c, l3, FONT_TEXT, 17, w - 16); c.fillText(l3, 8, 127);
    c.fillStyle = '#1B1B22'; for (let x = 8, i = 0; x < w - 8; i++) { const bw = 1 + (i * 7 % 3); c.fillRect(x, 148, bw, 12); x += bw + 1 + (i % 2); }
  });
  const tagPivot = put(s, new T.Group(), 1.15, 2.2, 0.35);
  box(tagPivot, 0.012, 1.25, 0.012, M(0xc7832e), 0, -0.62, 0);
  const tag = new T.Mesh(new T.PlaneGeometry(1.0, 1.3), new T.MeshBasicMaterial({ map: tx, transparent: true, alphaTest: 0.5, side: T.DoubleSide, fog: false }));
  tag.position.y = -1.81;
  tagPivot.add(tag);

  s.add(new T.AmbientLight(0x6a76b8, 0.6));
  const warm = new T.PointLight(C.amber, 1.3, 9); warm.position.set(2, 2, 3); s.add(warm);
  const rim = new T.DirectionalLight(0x9faac8, 0.5); rim.position.set(-3, 2, -3); s.add(rim);
  const front = new T.DirectionalLight(0xffffff, 0.45); front.position.set(0, 1, 4); s.add(front);

  setHud(ctx.hud, `
    <p class="brand passive" style="position:absolute;left:32px;top:24px">SOUVENIRS DEL SOLSTICIO</p>
    <div class="corner" style="display:flex;gap:6px">${dueno ? '<button type="button" class="link" id="edit">EDITAR</button>' : ''}<button type="button" class="link" id="back">◄ VOLVER</button></div>
    <div class="side-actions">
      ${!dueno
        ? state.acceso?.autenticado
          ? '<button type="button" class="btn" disabled aria-disabled="true">VITRINA DE SOLO LECTURA</button>'
          : '<button type="button" class="btn" id="login">ENTRAR PARA ADMINISTRAR</button>'
        : frost
        ? `<button type="button" class="btn" disabled aria-disabled="true">ESCARCHADO · ${diasParaDescongelar(d, now)} DÍAS</button>`
        : '<button type="button" class="btn" id="buy">COMPRAR</button>'}
      <button type="button" class="btn ghost" id="later">DEJAR PARA MÁS TARDE</button>
      <p class="error" id="buy-error" role="alert"></p>
      <p class="hint passive" style="text-align:center">Arrastra para girar el globo</p>
    </div>`);
  const $ = (id) => ctx.hud.querySelector('#' + id);
  const leave = () => ctx.go('vitrina', { sel: d.id });
  let buying = false;
  const buy = async () => {
    if (frost || buying) return;
    buying = true;
    try {
      const r = await store.comprar(d.id);
      ctx.go('compra', { compraId: r.compra.id, nuevos: r.nuevos.map((l) => l.id) });
    } catch (e) {
      buying = false;
      $('buy-error').textContent = e.message || 'No se pudo completar la compra.';
    }
  };
  $('back').onclick = leave;
  if ($('edit')) $('edit').onclick = () => modalDeseo(ctx.hud, async (c) => { await store.updateDeseo(d.id, c); ctx.go('globo', { id: d.id }); }, d);
  $('later').onclick = leave;
  if ($('buy')) $('buy').onclick = buy;
  if ($('login')) $('login').onclick = () => modalAcceso(ctx.hud, store);

  let spin = 0.5, dragging = false, rot = 0;

  return {
    scene: s,
    camera: cam,
    update(t) {
      cam.position.set(Math.sin(t * 0.3) * 0.1, 0.2, 4.2);
      cam.lookAt(0, 0.1, 0);
      if (!dragging) { rot += spin * 0.016; spin += (0.5 - spin) * 0.02; }
      gl.holder.rotation.y = rot;
      gl.g.rotation.z = Math.sin(t * 0.7) * 0.03;
      gl.tick();
      tagPivot.rotation.z = Math.sin(t * 1.3) * 0.04;
      tagPivot.rotation.y = -0.25 + Math.sin(t * 0.8) * 0.12;
    },
    onPointer(type, p) {
      if (type === 'down') { dragging = true; spin = 0; }
      else if (type === 'drag') { rot += p.dx * 0.012; spin = p.dx * 0.6; }
      else { dragging = false; }
    },
    onKey(k) {
      if (dueno && (k === 'a' || k === 'enter')) buy();
      else if (k === 'b' || k === 'escape' || k === 'backspace') leave();
      else if (k === 'arrowleft') rot -= 0.3;
      else if (k === 'arrowright') rot += 0.3;
    },
  };
}
