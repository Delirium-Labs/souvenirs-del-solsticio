// Arranque: un solo renderer a 480×360 (pixelado), escenas intercambiables y HUD en HTML encima.
import './ui/style.css';
import { T, disposeTree } from './engine/lib.js';
import { createLocalStore } from './data/store.js';
import { entrada } from './scenes/entrada.js';
import { vitrina } from './scenes/vitrina.js';
import { globo } from './scenes/globo.js';
import { compra } from './scenes/compra.js';
import { libreta } from './scenes/libreta.js';

const SCENES = { entrada, vitrina, globo, compra, libreta };

const root = document.getElementById('root');
const stage = document.getElementById('stage');
const canvas = document.getElementById('view');
const hud = document.getElementById('hud');
const fade = document.getElementById('fade');

const renderer = new T.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(1);
renderer.setSize(480, 360, false);

const store = createLocalStore();

// Escala el escenario 960×720 para que quepa en la ventana.
function fitStage() {
  const s = Math.min(root.clientWidth / 960, root.clientHeight / 720);
  stage.style.transform = `scale(${s})`;
}
new ResizeObserver(fitStage).observe(root);
fitStage();

let current = null;
let currentName = '';
let busy = false;
let t0 = performance.now();

const ctx = { renderer, store, hud, stage, go };

async function go(name, params = {}) {
  if (busy || !SCENES[name]) return;
  busy = true;
  fade.classList.add('on');
  await new Promise((r) => setTimeout(r, current ? 190 : 0));
  if (current) { current.dispose?.(); disposeTree(current.scene); }
  hud.innerHTML = '';
  try {
    current = await SCENES[name](ctx, params);
  } catch (err) {
    console.error(err);
    current = await SCENES.vitrina(ctx, {});
    name = 'vitrina';
  }
  currentName = name;
  t0 = performance.now();
  if (location.hash.slice(1) !== name) history.replaceState(null, '', '#' + name);
  fade.classList.remove('on');
  busy = false;
}

window.addEventListener('hashchange', () => {
  const name = location.hash.slice(1);
  if (SCENES[name] && name !== currentName) go(name);
});

// Puntero: coordenadas normalizadas (-1..1) del canvas.
let drag = null;
const ndc = (e) => {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 };
};
canvas.addEventListener('pointerdown', (e) => {
  drag = { x: e.clientX, y: e.clientY, moved: 0 };
  canvas.setPointerCapture(e.pointerId);
  current?.onPointer?.('down', { ...ndc(e), dx: 0, dy: 0 });
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
  current?.onPointer?.('drag', { ...ndc(e), dx, dy });
});
canvas.addEventListener('pointerup', (e) => {
  if (!drag) return;
  const tap = drag.moved < 8;
  drag = null;
  current?.onPointer?.(tap ? 'tap' : 'up', { ...ndc(e), dx: 0, dy: 0 });
});

window.addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input, select, textarea')) return;
  if (hud.querySelector('.modal-back')) { if (e.key === 'Escape') hud.querySelector('.modal-back')?.remove(); return; }
  current?.onKey?.(e.key.toLowerCase(), e);
});

function loop(now) {
  if (current && !busy) {
    const t = (now - t0) / 1000;
    current.update?.(t);
    renderer.render(current.scene, current.camera);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

const start = location.hash.slice(1);
go(SCENES[start] ? start : 'entrada');
