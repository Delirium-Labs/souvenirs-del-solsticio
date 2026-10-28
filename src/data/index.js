import { VERSION, createLocalStore } from './store.js';
import { createSupabaseStore } from './supabase-store.js';

const VISITOR_KEY = 'souvenirs-solsticio-visitante-v1';

function estadoVisitante() {
  const fecha = new Date().toISOString();
  return {
    version: VERSION,
    demoDias: 0,
    ahorro: { monto: 0, actualizado: fecha, historial: [{ fecha, monto: 0 }] },
    deseos: [],
    compras: [],
    logros: {},
  };
}

function conVitrinaVisitante(remoto) {
  const visitante = createLocalStore({
    key: VISITOR_KEY,
    legacyKey: null,
    crearInicial: estadoVisitante,
  });
  let modo = 'publica';
  const activo = () => modo === 'personal' ? visitante : remoto;

  return {
    kind: 'supabase',
    get client() { return remoto.client; },
    now: () => activo().now(),

    async get() {
      const acceso = await remoto.getAccess();
      if (acceso.dueno) modo = 'publica';
      if (modo === 'personal') {
        const state = await visitante.get();
        return { ...state, acceso, ahorroVisible: true, vitrinaPersonal: true };
      }
      const [state, local] = await Promise.all([remoto.get(), visitante.get()]);
      return {
        ...state,
        vitrinaPersonal: false,
        vitrinaPersonalCantidad: local.deseos.length + local.compras.length,
      };
    },

    getAccess: () => remoto.getAccess(),
    login: (email) => remoto.login(email),
    async logout() {
      modo = 'publica';
      await remoto.logout();
    },

    async usarVitrinaPersonal() {
      modo = 'personal';
      return this.get();
    },
    async usarVitrinaPublica() {
      modo = 'publica';
      return this.get();
    },
    async addDeseoLocal(datos) {
      const deseo = await visitante.addDeseo(datos);
      modo = 'personal';
      return deseo;
    },

    addDeseo: (datos) => activo().addDeseo(datos),
    updateDeseo: (id, cambios) => activo().updateDeseo(id, cambios),
    comprar: (id) => activo().comprar(id),
    setAhorro: (monto) => activo().setAhorro(monto),
    adelantar: (dias) => activo().adelantar(dias),
    reiniciar: () => activo().reiniciar(),
    migrarDesdeLocal: (state) => remoto.migrarDesdeLocal(state),

    subscribe(listener) {
      const offRemoto = remoto.subscribe(listener);
      const offVisitante = visitante.subscribe(listener);
      return () => { offRemoto(); offVisitante(); };
    },
    dispose() {
      remoto.dispose?.();
      visitante.dispose?.();
    },
  };
}

/** Usa Supabase cuando están las variables públicas; si no, conserva la demo local. */
export function createStore() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (url && key) return conVitrinaVisitante(createSupabaseStore({ url, key }));
  return createLocalStore();
}
