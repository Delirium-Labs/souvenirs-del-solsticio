// Reglas de la tienda (PRD v0). Funciones puras: reciben el estado y la fecha.
export const DAY = 86400000;
export const DIAS_ESCARCHA = 7;
export const LIMITE_ESTANTE = 1000;

export const CATEGORIAS = ['Moto', 'Carro', 'Imagen y cámara', 'Casa', 'Tecnología', 'Estilo', 'Otro'];
export const PRIORIDADES = ['Alta', 'Media', 'Baja'];

const CAPITULOS = {
  '2026-09': 'El Apagón',
  '2026-10': 'La Noche Roja',
  '2026-11': 'El Amanecer',
  '2026-12': 'Flor del mediodía',
  '2027-01': 'The sun is about to set',
  '2027-02': 'Blessed by the sun',
};

export function capitulo(fecha) {
  const d = new Date(fecha);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return CAPITULOS[key] || 'Capítulo por nombrar';
}

export const dias = (desde, ahora) => Math.max(0, Math.floor((ahora - new Date(desde).getTime()) / DAY));
export const escarchado = (deseo, ahora) => dias(deseo.creado, ahora) < DIAS_ESCARCHA;
export const diasParaDescongelar = (deseo, ahora) => Math.max(0, DIAS_ESCARCHA - dias(deseo.creado, ahora));
/** Nieve acumulada en la base: 0 recién llegado, 1 a los 60 días, tope 1.4. */
export const nieve = (deseo, ahora) => Math.min(1.4, dias(deseo.creado, ahora) / 60);
export const estante = (deseo) => (deseo.precio >= LIMITE_ESTANTE ? 'arriba' : 'abajo');
export const faltan = (deseo, ahorro) => Math.max(0, deseo.precio - ahorro);

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const fechaCorta = (f) => { const d = new Date(f); return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`; };
export const dinero = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });

/** Logros iniciales. `check` recibe el estado completo y la fecha actual. */
export const LOGROS = [
  { id: 'primer', nombre: 'Primer souvenir', pista: 'Tu primera compra.', check: (s) => s.compras.length >= 1 },
  { id: 'paciencia', nombre: 'Paciencia de solsticio', pista: 'Un deseo esperó 90 días o más.', check: (s) => s.compras.some((c) => c.dias >= 90) },
  { id: 'rodando', nombre: 'Rodando', pista: 'Rodando en dos ruedas.', check: (s) => s.compras.some((c) => c.deseo.categoria === 'Moto') },
  { id: 'casa', nombre: 'Casa nueva', pista: 'Tres mejoras en la casa.', check: (s) => s.compras.filter((c) => c.deseo.categoria === 'Casa').length >= 3 },
  { id: 'lente', nombre: 'Lente listo', pista: 'El kit completo de la cámara.', check: (s) => s.compras.filter((c) => c.deseo.categoria === 'Imagen y cámara').length >= 3 },
  {
    id: 'flor', nombre: 'Flor del mediodía', pista: 'Diciembre sin tocar el ahorro.',
    check: (s, ahora) => {
      const ini = new Date(2026, 11, 1).getTime(), fin = new Date(2027, 0, 1).getTime();
      if (ahora < fin) return false;
      const teniaAhorro = s.ahorro.historial.some((h) => new Date(h.fecha).getTime() < ini);
      const movimientos = s.ahorro.historial.some((h) => {
        const t = new Date(h.fecha).getTime();
        return t >= ini && t < fin;
      });
      return teniaAhorro && !movimientos;
    },
  },
  {
    id: 'vacia', nombre: 'Vitrina vacía', pista: 'Vaciar un estante completo.',
    check: (s) => s.compras.some((c) => c.estanteVaciado === 'arriba' || c.estanteVaciado === 'abajo'),
  },
];
