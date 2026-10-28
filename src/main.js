// Arranque: un solo renderer a 480×360 (pixelado), escenas intercambiables y HUD en HTML encima.
import './ui/style.css';
import { T, disposeTree } from './engine/lib.js';
import { createStore } from './data/index.js';
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

const store = createStore();

// Escala el escenario 960×720 para que quepa en la ventana.
function fitStage() {
  const s = Math.min(root.clientWidth / 960, root.clientHeight / 720);
  stage.style.transform = `scale(${s})`;
}
new ResizeObserver(fitStage).observe(root);
fitStage();

let current = null;
let currentName = '';
let currentParams = {};
let busy = false;
let pending = null;
let t0 = performance.now();

const ctx = { renderer, store, hud, stage, go };

function routeFromHash() {
  const raw = location.hash.slice(1);
  const [name, query = ''] = raw.split('?');
  const search = new URLSearchParams(query);
  const params = Object.fromEntries(search);
  if (params.nuevos) params.nuevos = params.nuevos.split(',').filter(Boolean);
  return { name, params };
}

function hashFor(name, params = {}) {
  const search = new URLSearchParams();
  ['id', 'compraId'].forEach((key) => { if (params[key]) search.set(key, params[key]); });
  if (Array.isArray(params.nuevos) && params.nuevos.length) search.set('nuevos', params.nuevos.join(','));
  const query = search.toString();
  return `#${name}${query ? `?${query}` : ''}`;
}

function showRecovery(error) {
  console.error(error);
  current = null;
  currentName = 'error';
  hud.innerHTML = `
    <section class="empty" role="alert">
      <p id="fatal-message"></p>
      <button type="button" class="btn small" id="fatal-reset">REINICIAR DATOS</button>
    </section>`;
  hud.querySelector('#fatal-message').textContent = 'La tienda encontró datos dañados y no pudo abrirse.';
  hud.querySelector('#fatal-reset').onclick = async () => {
    await store.reiniciar();
    go('vitrina', {}, { history: 'replace' });
  };
}

async function go(name, params = {}, { history = 'push' } = {}) {
  if (!SCENES[name]) return;
  if (busy) {
    pending = { name, params, history };
    return;
  }
  busy = true;
  hud.inert = true;
  fade.classList.add('on');
  try {
    await new Promise((r) => setTimeout(r, current ? 190 : 0));
    if (current) { current.dispose?.(); disposeTree(current.scene); }
    current = null;
    hud.innerHTML = '';
    current = await SCENES[name](ctx, params);
    currentName = name;
    currentParams = params;
  } catch (err) {
    console.error(err);
    if (name !== 'vitrina') {
      try {
        current = await SCENES.vitrina(ctx, {});
        name = 'vitrina';
        params = {};
        history = 'replace';
        currentName = name;
        currentParams = params;
      } catch (fallbackError) {
        showRecovery(fallbackError);
      }
    } else {
      showRecovery(err);
    }
  } finally {
    if (current) {
      t0 = performance.now();
      const target = hashFor(name, params);
      if (history !== 'none' && location.hash !== target) {
        if (history === 'replace' || !location.hash) window.history.replaceState(null, '', target);
        else window.history.pushState(null, '', target);
      }
    }
    fade.classList.remove('on');
    hud.inert = false;
    busy = false;
  }
  if (pending) {
    const next = pending;
    pending = null;
    go(next.name, next.params, { history: next.history });
  }
}

window.addEventListener('hashchange', () => {
  const { name, params } = routeFromHash();
  if (SCENES[name] && (name !== currentName || hashFor(name, params) !== hashFor(currentName, currentParams))) {
    go(name, params, { history: 'none' });
  }
});

// Puntero: coordenadas normalizadas (-1..1) del canvas.
let drag = null;
const ndc = (e) => {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 };
};
canvas.addEventListener('pointerdown', (e) => {
  if (busy) return;
  drag = { x: e.clientX, y: e.clientY, moved: 0 };
  canvas.setPointerCapture(e.pointerId);
  current?.onPointer?.('down', { ...ndc(e), dx: 0, dy: 0 });
});
canvas.addEventListener('pointermove', (e) => {
  if (busy || !drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
  current?.onPointer?.('drag', { ...ndc(e), dx, dy });
});
canvas.addEventListener('pointerup', (e) => {
  if (busy || !drag) return;
  const tap = drag.moved < 8;
  drag = null;
  current?.onPointer?.(tap ? 'tap' : 'up', { ...ndc(e), dx: 0, dy: 0 });
});

window.addEventListener('keydown', (e) => {
  if (busy) return;
  if (e.target.closest && e.target.closest('input, select, textarea')) return;
  if (hud.querySelector('.modal-back')) { if (e.key === 'Escape') hud.querySelector('.modal-back [data-close]')?.click(); return; }
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

store.subscribe?.(() => {
  if (currentName && currentName !== 'error') go(currentName, currentParams, { history: 'replace' });
});

const start = routeFromHash();
go(SCENES[start.name] ? start.name : 'entrada', SCENES[start.name] ? start.params : {}, { history: 'replace' });
