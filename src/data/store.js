// Almacén de la demo: guarda todo en el navegador (localStorage).
// La interfaz es asíncrona a propósito: el adaptador de Supabase del ARD podrá reemplazarlo sin tocar las escenas.
import { LOGROS, dias, escarchado, capitulo, DAY } from './rules.js';
import { seed } from './seed.js';

const KEY = 'souvenirs-solsticio-demo-v2';

const read = () => { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } };
const write = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin almacenamiento: queda en memoria */ } };
const uid = () => Math.random().toString(36).slice(2, 10);

export function createLocalStore() {
  let state = read() || seed();

  const now = () => Date.now() + (state.demoDias || 0) * DAY;
  const save = () => write(state);

  /** Revisa logros y devuelve los recién desbloqueados. */
  const evaluar = () => {
    const nuevos = [];
    const t = now();
    for (const l of LOGROS) {
      if (!state.logros[l.id] && l.check(state, t)) { state.logros[l.id] = new Date(t).toISOString(); nuevos.push(l); }
    }
    return nuevos;
  };

  return {
    now,
    async get() { return state; },

    async addDeseo({ nombre, precio, categoria, prioridad, modelo, color, piezas }) {
      const d = { id: uid(), nombre: nombre.trim(), precio: Number(precio), categoria, prioridad, modelo, color, creado: new Date(now()).toISOString() };
      if (piezas) d.piezas = piezas;
      state.deseos.push(d);
      save();
      return d;
    },

    /** Corrige nombre, precio, categoría, prioridad, objeto o color. La fecha de alta no cambia. */
    async updateDeseo(id, cambios) {
      const d = state.deseos.find((x) => x.id === id);
      if (!d) throw new Error('Ese deseo ya no está en la vitrina.');
      ['nombre', 'precio', 'categoria', 'prioridad', 'modelo', 'color'].forEach((k) => { if (cambios[k] !== undefined) d[k] = k === 'precio' ? Number(cambios[k]) : cambios[k]; });
      if (d.modelo !== 'ia') delete d.piezas;
      save();
      return d;
    },

    async comprar(id) {
      const d = state.deseos.find((x) => x.id === id);
      if (!d) throw new Error('Ese deseo ya no está en la vitrina.');
      if (escarchado(d, now())) throw new Error('Sigue escarchado: espera a que cumpla 7 días.');
      const fecha = new Date(now()).toISOString();
      const compra = { id: uid(), numero: state.compras.length + 1, deseo: d, fecha, valor: d.precio, dias: dias(d.creado, now()), capitulo: capitulo(fecha) };
      state.deseos = state.deseos.filter((x) => x.id !== id);
      state.compras.push(compra);
      const nuevos = evaluar();
      save();
      return { compra, nuevos };
    },

    async setAhorro(monto) {
      const fecha = new Date(now()).toISOString();
      state.ahorro = { monto: Number(monto), actualizado: fecha, historial: [...state.ahorro.historial, { fecha, monto: Number(monto) }] };
      const nuevos = evaluar();
      save();
      return nuevos;
    },

    /** Solo demo: adelanta el reloj para ver cómo se descongelan los globos y cae nieve. */
    async adelantar(n) { state.demoDias = (state.demoDias || 0) + n; const nuevos = evaluar(); save(); return nuevos; },

    async reiniciar() { state = seed(); save(); },
  };
}
