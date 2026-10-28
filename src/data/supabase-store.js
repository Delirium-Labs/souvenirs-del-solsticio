// Adaptador remoto: conserva la interfaz asíncrona del store local y aplica RLS en Supabase.
import { createClient } from '@supabase/supabase-js';
import { capitulo, dias, escarchado } from './rules.js';
import { seed } from './seed.js';
import {
  VERSION,
  clone,
  evaluarLogros,
  montoValido,
  normalizarDeseo,
  normalizarEstado,
  precioValido,
  uid,
} from './store.js';

const APP_ID = 'souvenirs';

const deseoDesdeFila = (fila) => ({
  id: fila.id,
  nombre: fila.nombre,
  precio: Number(fila.precio),
  categoria: fila.categoria,
  prioridad: fila.prioridad,
  modelo: fila.modelo,
  color: fila.color,
  piezas: fila.piezas || undefined,
  creado: fila.creado,
});

const deseoAFila = (deseo) => ({
  id: deseo.id,
  nombre: deseo.nombre,
  precio: deseo.precio,
  categoria: deseo.categoria,
  prioridad: deseo.prioridad,
  modelo: deseo.modelo,
  color: deseo.color,
  piezas: deseo.piezas || null,
  creado: deseo.creado,
});

const compraDesdeFila = (fila) => ({
  id: fila.id,
  numero: Number(fila.numero),
  deseo: fila.deseo,
  fecha: fila.fecha,
  valor: Number(fila.valor),
  dias: Number(fila.dias),
  capitulo: fila.capitulo,
  estanteVaciado: fila.estante_vaciado || null,
});

const compraAFila = (compra) => ({
  id: compra.id,
  numero: compra.numero,
  deseo: compra.deseo,
  fecha: compra.fecha,
  valor: compra.valor,
  dias: compra.dias,
  capitulo: compra.capitulo,
  estante_vaciado: compra.estanteVaciado || null,
});

function fallo(error, fallback) {
  if (!error) return;
  console.error(error);
  throw new Error(error.message || fallback);
}

export function createSupabaseStore({ url, key }) {
  const supabase = createClient(url, key, {
    db: { schema: 'souvenirs' },
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  const db = supabase.schema('souvenirs');
  const core = supabase.schema('core');
  const listeners = new Set();
  let demoDias = 0;
  let acceso = { configurado: true, autenticado: false, dueno: false, email: null };

  const now = () => Date.now() + demoDias * 86400000;

  async function refrescarAcceso() {
    const { data, error } = await supabase.auth.getUser();
    const user = error ? null : data.user;
    if (!user) {
      acceso = { configurado: true, autenticado: false, dueno: false, email: null };
      return acceso;
    }
    const { data: dueno, error: roleError } = await core.rpc('es_dueno', { p_app: APP_ID });
    if (roleError) console.error(roleError);
    acceso = {
      configurado: true,
      autenticado: true,
      dueno: !roleError && dueno === true,
      email: user.email || null,
    };
    return acceso;
  }

  const inicial = refrescarAcceso();
  const { data: authListener } = supabase.auth.onAuthStateChange(() => {
    setTimeout(async () => {
      await refrescarAcceso();
      listeners.forEach((listener) => listener());
    }, 0);
  });

  async function exigirDueno() {
    await inicial;
    await refrescarAcceso();
    if (!acceso.autenticado) throw new Error('Inicia sesión para modificar la vitrina.');
    if (!acceso.dueno) throw new Error('Tu cuenta no tiene permiso para modificar esta vitrina.');
  }

  async function persistirLogros(state) {
    const filas = Object.entries(state.logros).map(([id, desbloqueado_en]) => ({ id, desbloqueado_en }));
    if (!filas.length) return;
    const { error } = await db.from('logros').upsert(filas, { onConflict: 'id' });
    fallo(error, 'No se pudieron guardar los logros.');
  }

  async function leerEstado() {
    await inicial;
    const [deseosRes, comprasRes, logrosRes] = await Promise.all([
      db.from('deseos').select('*').order('creado', { ascending: true }),
      db.from('compras').select('*').order('numero', { ascending: true }),
      db.from('logros').select('*'),
    ]);
    fallo(deseosRes.error, 'No se pudo abrir la vitrina.');
    fallo(comprasRes.error, 'No se pudieron cargar las compras.');
    fallo(logrosRes.error, 'No se pudieron cargar los logros.');

    let ahorro = { monto: 0, actualizado: new Date().toISOString(), historial: [] };
    demoDias = 0;
    if (acceso.dueno) {
      const { data, error } = await db.from('ahorro').select('*').eq('id', 'actual').maybeSingle();
      fallo(error, 'No se pudo cargar el ahorro.');
      if (data) {
        ahorro = {
          monto: Number(data.monto),
          actualizado: data.actualizado,
          historial: data.historial,
        };
        demoDias = Number(data.demo_dias) || 0;
      }
    }

    const logros = Object.fromEntries((logrosRes.data || []).map((fila) => [fila.id, fila.desbloqueado_en]));
    const state = normalizarEstado({
      version: VERSION,
      demoDias,
      ahorro,
      deseos: (deseosRes.data || []).map(deseoDesdeFila),
      compras: (comprasRes.data || []).map(compraDesdeFila),
      logros,
    });
    state.acceso = clone(acceso);
    state.ahorroVisible = acceso.dueno;
    return state;
  }

  async function reemplazarEstado(raw) {
    await exigirDueno();
    const state = normalizarEstado(raw);
    const logros = Object.entries(state.logros).map(([id, desbloqueado_en]) => ({ id, desbloqueado_en }));
    const { error } = await db.rpc('reemplazar_estado', {
      p_deseos: state.deseos.map(deseoAFila),
      p_compras: state.compras.map(compraAFila),
      p_logros: logros,
      p_ahorro: {
        monto: state.ahorro.monto,
        actualizado: state.ahorro.actualizado,
        historial: state.ahorro.historial,
        demo_dias: state.demoDias,
      },
    });
    fallo(error, 'No se pudo reemplazar el estado de la tienda.');
    demoDias = state.demoDias;
  }

  return {
    kind: 'supabase',
    now,
    client: supabase,

    async get() {
      const state = await leerEstado();
      if (acceso.dueno && evaluarLogros(state, now()).length) await persistirLogros(state);
      return clone(state);
    },

    async getAccess() {
      await inicial;
      return clone(acceso);
    },

    async login(email) {
      const limpio = String(email || '').trim();
      if (!limpio || !limpio.includes('@')) throw new Error('Escribe un correo válido.');
      const redirectTo = `${location.origin}${location.pathname}?auth=souvenirs#vitrina`;
      const { error } = await supabase.auth.signInWithOtp({
        email: limpio,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
      });
      fallo(error, 'No se pudo enviar el enlace de acceso.');
    },

    async logout() {
      const { error } = await supabase.auth.signOut();
      fallo(error, 'No se pudo cerrar la sesión.');
      await refrescarAcceso();
    },

    async addDeseo(datos) {
      await exigirDueno();
      if (!String(datos.nombre || '').trim()) throw new Error('Ponle un nombre al deseo.');
      const d = normalizarDeseo({
        ...datos,
        id: uid(),
        precio: precioValido(datos.precio),
        creado: new Date(now()).toISOString(),
      });
      if (datos.modelo === 'ia' && d.modelo !== 'ia') throw new Error('El souvenir de IA necesita al menos 3 piezas válidas.');
      const { error } = await db.from('deseos').insert(deseoAFila(d));
      fallo(error, 'No se pudo agregar el deseo.');
      return clone(d);
    },

    async updateDeseo(id, cambios) {
      await exigirDueno();
      const { data: fila, error: readError } = await db.from('deseos').select('*').eq('id', id).maybeSingle();
      fallo(readError, 'No se pudo leer el deseo.');
      if (!fila) throw new Error('Ese deseo ya no está en la vitrina.');
      const actual = deseoDesdeFila(fila);
      const siguiente = normalizarDeseo({
        ...actual,
        ...cambios,
        id: actual.id,
        creado: actual.creado,
        piezas: cambios.modelo && cambios.modelo !== 'ia' ? undefined : actual.piezas,
        precio: cambios.precio === undefined ? actual.precio : precioValido(cambios.precio),
      });
      const { error } = await db.from('deseos').update(deseoAFila(siguiente)).eq('id', id);
      fallo(error, 'No se pudo actualizar el deseo.');
      return clone(siguiente);
    },

    async comprar(id) {
      await exigirDueno();
      const { data: fila, error: readError } = await db.from('deseos').select('*').eq('id', id).maybeSingle();
      fallo(readError, 'No se pudo leer el deseo.');
      if (!fila) throw new Error('Ese deseo ya no está en la vitrina.');
      const deseo = deseoDesdeFila(fila);
      if (escarchado(deseo, now())) throw new Error('Sigue escarchado: espera a que cumpla 7 días.');
      const fecha = new Date(now()).toISOString();
      const { data, error } = await db.rpc('comprar', {
        p_id: id,
        p_fecha: fecha,
        p_dias: dias(deseo.creado, now()),
        p_capitulo: capitulo(fecha),
      });
      fallo(error, 'No se pudo completar la compra.');
      const compra = compraDesdeFila(data);
      const state = await leerEstado();
      const nuevos = evaluarLogros(state, now());
      if (nuevos.length) await persistirLogros(state);
      return { compra, nuevos };
    },

    async setAhorro(monto) {
      await exigirDueno();
      const state = await leerEstado();
      const valor = montoValido(monto);
      const fecha = new Date(now()).toISOString();
      const historial = [...state.ahorro.historial, { fecha, monto: valor }];
      const { error } = await db.from('ahorro').upsert({
        id: 'actual',
        monto: valor,
        actualizado: fecha,
        historial,
        demo_dias: demoDias,
      });
      fallo(error, 'No se pudo guardar el ahorro.');
      state.ahorro = { monto: valor, actualizado: fecha, historial };
      const nuevos = evaluarLogros(state, now());
      if (nuevos.length) await persistirLogros(state);
      return nuevos;
    },

    async adelantar(n) {
      await exigirDueno();
      const extra = Number(n);
      if (!Number.isFinite(extra) || extra <= 0 || extra > 3650) throw new Error('El avance del reloj no es válido.');
      const state = await leerEstado();
      demoDias += Math.floor(extra);
      const { error } = await db.from('ahorro').upsert({
        id: 'actual',
        monto: state.ahorro.monto,
        actualizado: state.ahorro.actualizado,
        historial: state.ahorro.historial,
        demo_dias: demoDias,
      });
      fallo(error, 'No se pudo adelantar el reloj.');
      state.demoDias = demoDias;
      const nuevos = evaluarLogros(state, now());
      if (nuevos.length) await persistirLogros(state);
      return nuevos;
    },

    async reiniciar() {
      await reemplazarEstado(seed());
    },

    async migrarDesdeLocal(state) {
      await reemplazarEstado(state);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    dispose() {
      authListener.subscription.unsubscribe();
    },
  };
}
