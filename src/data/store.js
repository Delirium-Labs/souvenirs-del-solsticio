// Almacén de la demo: guarda todo en el navegador (localStorage).
// La interfaz es asíncrona a propósito: el adaptador de Supabase del ARD podrá reemplazarlo sin tocar las escenas.
import { LOGROS, CATEGORIAS, PRIORIDADES, dias, escarchado, estante, capitulo, DAY } from './rules.js';
import { seed } from './seed.js';
import { MODELOS } from '../models/index.js';
import { sanitizeParts } from '../models/parts.js';

const KEY = 'souvenirs-solsticio-demo-v3';
const LEGACY_KEY = 'souvenirs-solsticio-demo-v2';
export const VERSION = 3;
const MAX_PRECIO = 1000000000;
const HEX = /^#[0-9a-fA-F]{6}$/;

const parse = (raw) => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };
const readStorage = (key, legacyKey) => {
  try {
    const actual = parse(localStorage.getItem(key));
    if (actual) return actual;
    return legacyKey ? parse(localStorage.getItem(legacyKey)) : null;
  } catch { return null; }
};
const writeStorage = (key, state) => { try { localStorage.setItem(key, JSON.stringify(state)); return true; } catch { return false; } };
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const clone = (value) => globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const fechaValida = (value, fallback) => Number.isFinite(new Date(value).getTime()) ? new Date(value).toISOString() : fallback;

export function precioValido(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_PRECIO) throw new Error('El precio debe estar entre $0.01 y $1,000,000,000.');
  return Math.round(n * 100) / 100;
}

export function montoValido(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > MAX_PRECIO) throw new Error('El ahorro debe estar entre $0 y $1,000,000,000.');
  return Math.round(n * 100) / 100;
}

function eleccion(value, opciones, fallback) {
  return opciones.includes(value) ? value : fallback;
}

export function normalizarDeseo(raw, fallbackFecha = new Date().toISOString()) {
  if (!raw || typeof raw !== 'object') return null;
  const modelo = Object.hasOwn(MODELOS, raw.modelo) ? raw.modelo : 'regalo';
  const d = {
    id: String(raw.id || uid()),
    nombre: String(raw.nombre || '').trim().slice(0, 60) || 'Deseo sin nombre',
    precio: (() => { try { return precioValido(raw.precio); } catch { return 1; } })(),
    categoria: eleccion(raw.categoria, CATEGORIAS, 'Otro'),
    prioridad: eleccion(raw.prioridad, PRIORIDADES, 'Media'),
    modelo,
    color: HEX.test(String(raw.color || '')) ? String(raw.color).toLowerCase() : MODELOS[modelo].color,
    creado: fechaValida(raw.creado, fallbackFecha),
  };
  if (modelo === 'ia') {
    const piezas = sanitizeParts(raw.piezas);
    if (piezas.length >= 3) d.piezas = piezas;
    else d.modelo = 'regalo';
  }
  return d;
}

export function normalizarEstado(raw, crearInicial = seed) {
  const version = Number(raw?.version);
  const formaValida = (version === 2 || version === VERSION)
    && Array.isArray(raw.deseos)
    && Array.isArray(raw.compras)
    && raw.ahorro && typeof raw.ahorro === 'object'
    && Array.isArray(raw.ahorro.historial)
    && raw.logros && typeof raw.logros === 'object';
  if (!formaValida) return crearInicial();
  const base = crearInicial();
  const ahora = new Date().toISOString();
  const ids = new Set();
  const deseos = (Array.isArray(raw.deseos) ? raw.deseos : []).map((d) => normalizarDeseo(d, ahora)).filter((d) => {
    if (!d || ids.has(d.id)) return false;
    ids.add(d.id);
    return true;
  });
  const compras = (Array.isArray(raw.compras) ? raw.compras : []).map((c, i) => {
    const deseo = normalizarDeseo(c?.deseo, ahora);
    if (!deseo) return null;
    const fecha = fechaValida(c.fecha, ahora);
    return {
      id: String(c.id || uid()),
      numero: Number.isInteger(Number(c.numero)) && Number(c.numero) > 0 ? Number(c.numero) : i + 1,
      deseo,
      fecha,
      valor: (() => { try { return precioValido(c.valor ?? deseo.precio); } catch { return deseo.precio; } })(),
      dias: Math.max(0, Math.floor(Number(c.dias) || 0)),
      capitulo: String(c.capitulo || capitulo(fecha)).slice(0, 80),
      estanteVaciado: c.estanteVaciado === 'arriba' || c.estanteVaciado === 'abajo' ? c.estanteVaciado : null,
    };
  }).filter(Boolean);
  const historial = (Array.isArray(raw.ahorro?.historial) ? raw.ahorro.historial : []).map((h) => {
    const monto = Number(h?.monto);
    if (!Number.isFinite(monto) || monto < 0 || monto > MAX_PRECIO) return null;
    return { fecha: fechaValida(h.fecha, ahora), monto: Math.round(monto * 100) / 100 };
  }).filter(Boolean);
  let monto;
  try { monto = montoValido(raw.ahorro?.monto ?? base.ahorro.monto); } catch { monto = base.ahorro.monto; }
  const actualizado = fechaValida(raw.ahorro?.actualizado, historial.at(-1)?.fecha || ahora);
  if (!historial.length) historial.push({ fecha: actualizado, monto });
  const logros = {};
  if (raw.logros && typeof raw.logros === 'object') {
    for (const logro of LOGROS) {
      if (raw.logros[logro.id]) logros[logro.id] = fechaValida(raw.logros[logro.id], ahora);
    }
  }
  return {
    version: VERSION,
    demoDias: Number.isFinite(Number(raw.demoDias)) ? Math.max(0, Math.floor(Number(raw.demoDias))) : 0,
    ahorro: { monto, actualizado, historial },
    deseos,
    compras,
    logros,
  };
}

/** Muta `state.logros` y devuelve los logros que se acaban de desbloquear. */
export function evaluarLogros(state, ahora) {
  const nuevos = [];
  for (const logro of LOGROS) {
    if (!state.logros[logro.id] && logro.check(state, ahora)) {
      state.logros[logro.id] = new Date(ahora).toISOString();
      nuevos.push(logro);
    }
  }
  return nuevos;
}

export function createLocalStore({ key = KEY, legacyKey = LEGACY_KEY, crearInicial = seed } = {}) {
  const read = () => readStorage(key, legacyKey);
  const write = (state) => writeStorage(key, state);
  let state = normalizarEstado(read() || crearInicial(), crearInicial);
  const listeners = new Set();
  write(state);

  const now = () => Date.now() + (state.demoDias || 0) * DAY;
  const commit = (next) => {
    state = normalizarEstado(next, crearInicial);
    write(state);
    return state;
  };
  const refresh = () => {
    const disk = read();
    if (disk) state = normalizarEstado(disk, crearInicial);
  };

  /** Revisa logros y devuelve los recién desbloqueados. */
  const evaluar = () => evaluarLogros(state, now());

  const onStorage = (event) => {
    if (event.key !== key || !event.newValue) return;
    state = normalizarEstado(parse(event.newValue), crearInicial);
    listeners.forEach((listener) => listener());
  };
  globalThis.addEventListener?.('storage', onStorage);

  return {
    now,
    async get() {
      refresh();
      if (evaluar().length) write(state);
      return clone(state);
    },

    async addDeseo({ nombre, precio, categoria, prioridad, modelo, color, piezas }) {
      refresh();
      const d = normalizarDeseo({ id: uid(), nombre, precio: precioValido(precio), categoria, prioridad, modelo, color, piezas, creado: new Date(now()).toISOString() });
      if (!String(nombre || '').trim()) throw new Error('Ponle un nombre al deseo.');
      if (modelo === 'ia' && d.modelo !== 'ia') throw new Error('El souvenir de IA necesita al menos 3 piezas válidas.');
      commit({ ...state, deseos: [...state.deseos, d] });
      return clone(d);
    },

    /** Corrige nombre, precio, categoría, prioridad, objeto o color. La fecha de alta no cambia. */
    async updateDeseo(id, cambios) {
      refresh();
      const d = state.deseos.find((x) => x.id === id);
      if (!d) throw new Error('Ese deseo ya no está en la vitrina.');
      const siguiente = {
        ...d,
        nombre: cambios.nombre !== undefined ? String(cambios.nombre).trim() : d.nombre,
        precio: cambios.precio !== undefined ? precioValido(cambios.precio) : d.precio,
        categoria: cambios.categoria !== undefined ? eleccion(cambios.categoria, CATEGORIAS, d.categoria) : d.categoria,
        prioridad: cambios.prioridad !== undefined ? eleccion(cambios.prioridad, PRIORIDADES, d.prioridad) : d.prioridad,
        modelo: cambios.modelo !== undefined && Object.hasOwn(MODELOS, cambios.modelo) ? cambios.modelo : d.modelo,
        color: cambios.color !== undefined && HEX.test(String(cambios.color)) ? String(cambios.color).toLowerCase() : d.color,
      };
      if (!siguiente.nombre) throw new Error('Ponle un nombre al deseo.');
      if (siguiente.modelo !== 'ia') delete siguiente.piezas;
      const deseos = state.deseos.map((x) => x.id === id ? siguiente : x);
      commit({ ...state, deseos });
      return clone(siguiente);
    },

    async comprar(id) {
      refresh();
      const d = state.deseos.find((x) => x.id === id);
      if (!d) throw new Error('Ese deseo ya no está en la vitrina.');
      if (escarchado(d, now())) throw new Error('Sigue escarchado: espera a que cumpla 7 días.');
      const fecha = new Date(now()).toISOString();
      const deseos = state.deseos.filter((x) => x.id !== id);
      const lado = estante(d);
      const compra = {
        id: uid(),
        numero: state.compras.length + 1,
        deseo: clone(d),
        fecha,
        valor: d.precio,
        dias: dias(d.creado, now()),
        capitulo: capitulo(fecha),
        estanteVaciado: deseos.some((x) => estante(x) === lado) ? null : lado,
      };
      state = normalizarEstado({ ...state, deseos, compras: [...state.compras, compra] }, crearInicial);
      const nuevos = evaluar();
      write(state);
      return { compra: clone(compra), nuevos };
    },

    async setAhorro(monto) {
      refresh();
      const valor = montoValido(monto);
      const fecha = new Date(now()).toISOString();
      state = normalizarEstado({ ...state, ahorro: { monto: valor, actualizado: fecha, historial: [...state.ahorro.historial, { fecha, monto: valor }] } }, crearInicial);
      const nuevos = evaluar();
      write(state);
      return nuevos;
    },

    /** Solo demo: adelanta el reloj para ver cómo se descongelan los globos y cae nieve. */
    async adelantar(n) {
      refresh();
      const diasExtra = Number(n);
      if (!Number.isFinite(diasExtra) || diasExtra <= 0 || diasExtra > 3650) throw new Error('El avance del reloj no es válido.');
      state = normalizarEstado({ ...state, demoDias: (state.demoDias || 0) + Math.floor(diasExtra) }, crearInicial);
      const nuevos = evaluar();
      write(state);
      return nuevos;
    },

    async reiniciar() { commit(crearInicial()); },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    dispose() { globalThis.removeEventListener?.('storage', onStorage); },
  };
}
