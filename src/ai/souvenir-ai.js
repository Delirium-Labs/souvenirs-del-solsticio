// "Crear con IA": la persona usa su propia llave (Anthropic u OpenAI) y la IA convierte su deseo en un souvenir.
// La llamada sale directo del navegador al proveedor. La llave nunca pasa por un servidor nuestro.
import { CATEGORIAS, PRIORIDADES } from '../data/rules.js';
import { MODELOS } from '../models/index.js';
import { sanitizeParts, MAX_PIEZAS } from '../models/parts.js';

export const PROVEEDORES = {
  anthropic: { label: 'Anthropic (Claude)', model: 'claude-sonnet-5-5', keyHint: 'sk-ant-…' },
  openai: { label: 'OpenAI', model: 'gpt-5-mini', keyHint: 'sk-…' },
};

const SAVE_KEY = 'souvenirs-ia-llave';
let memoria = null; // { provider, model, key } solo mientras la pestaña esté abierta

export function getLlave() {
  if (memoria) return memoria;
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) memoria = JSON.parse(raw); } catch { /* sin almacenamiento */ }
  return memoria;
}
export function setLlave(cfg, recordar) {
  memoria = cfg;
  try { if (recordar) localStorage.setItem(SAVE_KEY, JSON.stringify(cfg)); else localStorage.removeItem(SAVE_KEY); } catch { /* sin almacenamiento */ }
}
export function olvidarLlave() { memoria = null; try { localStorage.removeItem(SAVE_KEY); } catch { /* nada */ } }
export const llaveRecordada = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } };

function systemPrompt() {
  const modelos = Object.keys(MODELOS).filter((k) => k !== 'ia').join(', ');
  return `You turn a person's wish (written in Spanish) into a low-poly 3D souvenir for a snow globe in a 90s-style night shop.
Reply with ONLY a JSON object, no prose, no code fences:
{
  "nombre": string (max 60 chars, Spanish, the product as the person named it),
  "precio": number (USD; use the price the person gave, otherwise your best estimate),
  "categoria": one of ${JSON.stringify(CATEGORIAS)},
  "prioridad": one of ${JSON.stringify(PRIORIDADES)} (default "Media"),
  "color": "#rrggbb" (main color),
  "modelo": "ia",
  "piezas": array of 12 to ${Math.min(45, MAX_PIEZAS)} parts
}
Use "modelo" = one of [${modelos}] only if that ready-made object clearly fits (then "piezas" may be []).
Each part: {"shape": "box"|"cylinder"|"sphere"|"cone"|"torus", "size": [a,b,c], "pos": [x,y,z], "rot": [rx,ry,rz] (radians), "color": "#rrggbb", "glow": boolean}.
size meaning: box [width,height,depth]; cylinder [radiusTop,radiusBottom,height] (axis = Y); sphere [radius,0,0]; cone [radius,height,0] (axis = Y); torus [radius,tube,0] (ring in the XY plane).
Space: the object rests on y = 0, fits in about 1.2 (x) by 1.2 (y) by 0.8 (z), centered on x = 0 and z = 0, front faces +Z. Vehicles face +X.
Style: chunky, readable silhouette, flat colors, a few small details (lights, screens and LEDs use "glow": true).
Make an original stylized souvenir of that kind of object: no text, no logos, no brand marks, no copy of a specific product's signature design.`;
}

function extraerJSON(text) {
  const t = String(text || '').replace(/```(?:json)?/g, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('La IA no devolvió un souvenir válido. Prueba otra vez.');
  return JSON.parse(t.slice(a, b + 1));
}

/** Valida la respuesta y la convierte en un deseo listo para la vitrina. */
export function aDeseo(obj) {
  const nombre = String(obj.nombre || '').trim().slice(0, 60) || 'Deseo sin nombre';
  const precio = Math.max(0, Math.round(Number(obj.precio) * 100) / 100) || 1;
  const categoria = CATEGORIAS.includes(obj.categoria) ? obj.categoria : 'Otro';
  const prioridad = PRIORIDADES.includes(obj.prioridad) ? obj.prioridad : 'Media';
  const color = /^#[0-9a-fA-F]{6}$/.test(obj.color || '') ? obj.color : '#d2463c';
  const piezas = sanitizeParts(obj.piezas);
  const modelo = obj.modelo && obj.modelo !== 'ia' && MODELOS[obj.modelo] ? obj.modelo : 'ia';
  if (modelo === 'ia' && piezas.length < 3) throw new Error('La IA no armó suficientes piezas. Prueba describirlo con más detalle.');
  return { nombre, precio, categoria, prioridad, color, modelo, piezas: modelo === 'ia' ? piezas : undefined };
}

async function llamar({ provider, model, key }, texto, signal) {
  let res;
  try {
    if (provider === 'anthropic') {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({ model, max_tokens: 4000, system: systemPrompt(), messages: [{ role: 'user', content: texto }] }),
      });
    } else {
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: systemPrompt() }, { role: 'user', content: texto }] }),
      });
    }
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con la IA. Revisa tu internet. En la vista previa dentro de Claude estas llamadas están bloqueadas: pruébalo en la versión de Vercel.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 403) throw new Error('La llave no es válida o no tiene permiso para ese modelo.');
  if (res.status === 404) throw new Error(`El modelo "${model}" no existe para esa llave. Cámbialo y prueba otra vez.`);
  if (res.status === 429) throw new Error('La IA dice que vas muy rápido o no tienes saldo. Espera un momento.');
  if (!res.ok) throw new Error(data?.error?.message || `La IA respondió con error ${res.status}.`);
  return provider === 'anthropic' ? (data.content || []).map((c) => c.text || '').join('') : data.choices?.[0]?.message?.content;
}

/** Pide el souvenir a la IA y devuelve un deseo validado. */
export async function crearConIA(cfg, texto, { signal } = {}) {
  if (!cfg?.key) throw new Error('Pega tu llave de API para usar la IA.');
  if (!PROVEEDORES[cfg.provider]) throw new Error('El proveedor de IA no es válido.');
  if (!String(cfg.model || '').trim()) throw new Error('Escribe el nombre del modelo de IA.');
  if (!texto.trim()) throw new Error('Describe tu deseo: qué es, color y precio si lo sabes.');
  return aDeseo(extraerJSON(await llamar(cfg, texto, signal)));
}

/** Ejemplo sin llave, para ver el resultado sin gastar nada. */
export const EJEMPLO = {
  nombre: 'Guitarra eléctrica roja', precio: 699, categoria: 'Otro', prioridad: 'Media', color: '#d2463c', modelo: 'ia',
  piezas: [
    { shape: 'box', size: [0.6, 0.04, 0.36], pos: [0, 0.02, 0], color: '#2b2f3a' },
    { shape: 'box', size: [0.04, 0.5, 0.04], pos: [0, 0.27, -0.14], rot: [0.25, 0, 0], color: '#2b2f3a' },
    { shape: 'cylinder', size: [0.3, 0.3, 0.09], pos: [0, 0.42, 0], rot: [1.5708, 0, 0], color: '#d2463c' },
    { shape: 'cylinder', size: [0.22, 0.22, 0.09], pos: [0.02, 0.72, 0], rot: [1.5708, 0, 0], color: '#d2463c' },
    { shape: 'cylinder', size: [0.17, 0.17, 0.095], pos: [-0.06, 0.5, 0.002], rot: [1.5708, 0, 0], color: '#eef1f6' },
    { shape: 'box', size: [0.15, 0.05, 0.1], pos: [0, 0.52, 0.01], color: '#16161c' },
    { shape: 'box', size: [0.15, 0.05, 0.1], pos: [0, 0.64, 0.01], color: '#16161c' },
    { shape: 'box', size: [0.16, 0.04, 0.1], pos: [0, 0.38, 0.01], color: '#b9c0cc' },
    { shape: 'cylinder', size: [0.03, 0.03, 0.11], pos: [0.16, 0.3, 0], rot: [1.5708, 0, 0], color: '#b9c0cc' },
    { shape: 'cylinder', size: [0.03, 0.03, 0.11], pos: [0.21, 0.4, 0], rot: [1.5708, 0, 0], color: '#b9c0cc' },
    { shape: 'box', size: [0.08, 0.72, 0.05], pos: [0, 1.15, 0], color: '#c8955a' },
    { shape: 'box', size: [0.07, 0.72, 0.056], pos: [0, 1.15, 0.002], color: '#4a2c1a' },
    { shape: 'box', size: [0.12, 0.2, 0.04], pos: [0, 1.6, 0], rot: [0, 0, 0.1], color: '#d2463c' },
    { shape: 'cylinder', size: [0.015, 0.015, 0.06], pos: [-0.07, 1.55, 0], rot: [0, 0, 1.5708], color: '#b9c0cc' },
    { shape: 'cylinder', size: [0.015, 0.015, 0.06], pos: [-0.07, 1.62, 0], rot: [0, 0, 1.5708], color: '#b9c0cc' },
    { shape: 'cylinder', size: [0.015, 0.015, 0.06], pos: [0.07, 1.58, 0], rot: [0, 0, 1.5708], color: '#b9c0cc' },
    { shape: 'box', size: [0.004, 1.2, 0.004], pos: [-0.018, 0.98, 0.05], color: '#e6ecf7', glow: true },
    { shape: 'box', size: [0.004, 1.2, 0.004], pos: [0, 0.98, 0.05], color: '#e6ecf7', glow: true },
    { shape: 'box', size: [0.004, 1.2, 0.004], pos: [0.018, 0.98, 0.05], color: '#e6ecf7', glow: true },
    { shape: 'sphere', size: [0.02, 0, 0], pos: [0.13, 0.62, 0.05], color: '#f2b35c', glow: true },
  ],
};
