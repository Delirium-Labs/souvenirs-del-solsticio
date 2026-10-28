# Souvenirs del Solsticio

Proyecto #1 de Delirium Labs. Una lista de deseos como tienda nocturna de globos de nieve, con look de juego 3D de los noventa. JavaScript puro (ES modules), Vite 5 y Three.js `0.149.0`. Sin framework, sin TypeScript y sin tests.

Responde y escribe la interfaz en español. Los comentarios del código también van en español.

## Correr

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # dist/
npm run build:artifact # dist-artifact/souvenirs.html (un solo archivo, three por CDN)
```

Node 18 o más nuevo. No hay suite de pruebas: verifica la escena tocada en el navegador.

## Mapa

| Ruta | Rol |
| --- | --- |
| `src/main.js` | Renderer único 480×360, loop, cambio de escena, puntero y teclado |
| `src/scenes/` | `entrada`, `vitrina`, `globo`, `compra`, `libreta` |
| `src/engine/lib.js` | Geometría low-poly, materiales, texturas de texto, nieve |
| `src/models/` | Objetos propios (`detailed.js`, `moto.js`, `objects.js`), piezas de la IA (`parts.js`), globo (`index.js`) |
| `src/data/rules.js` | Reglas puras: días, escarcha, nieve, estantes, capítulos, logros |
| `src/data/store.js` | Persistencia de la demo en `localStorage` |
| `src/data/seed.js` | Datos de ejemplo |
| `src/ai/souvenir-ai.js` | Crear un deseo con la llave del usuario (Anthropic u OpenAI) |
| `src/ui/hud.js` + `style.css` | HUD 2D y formularios encima del canvas |
| `scripts/to-artifact.mjs` | Empaqueta la demo de un solo HTML |
| `vercel.json` | Build de Vite y CSP |

El hash de la URL (`#vitrina`, `#globo`, …) es la ruta. `go(nombre, params)` en `main.js` es el único cambio de escena.

## Contrato de una escena

Cada escena exporta `async function nombre(ctx, params)` y devuelve:

```js
{ scene, camera, update?(t), dispose?(), onPointer?(tipo, ndc), onKey?(key, event) }
```

`ctx` es `{ renderer, store, hud, stage, go }`. `tipo` del puntero es `'down'`, `'drag'`, `'tap'` o `'up'`. El HUD se vacía al salir; no dejes listeners globales sin limpiarlos en `dispose`.

Las escenas leen y escriben solo por `store`. No toques `localStorage` desde una escena.

## Reglas de la tienda

Viven en `src/data/rules.js`. No las dupliques en las escenas.

- Un deseo nuevo queda **escarchado 7 días** (`DIAS_ESCARCHA`). No se puede comprar antes.
- La nieve de la base crece con los días en vitrina: 0 al llegar, 1 a los 60 días, tope 1.4.
- Estante de arriba si `precio >= 1000`; si no, abajo.
- Comprar **no mueve el ahorro**. Solo saca el deseo de la vitrina, guarda la compra y evalúa logros.
- Editar un deseo no cambia su fecha de alta.
- `store.now()` incluye `demoDias` (el menú DEMO adelanta el reloj). Usa esa fecha, no `Date.now()` suelto, para escarcha, nieve y logros.

`createLocalStore()` es asíncrono a propósito (`get`, `addDeseo`, `updateDeseo`, `comprar`, `setAhorro`, `adelantar`, `reiniciar`). El siguiente paso del proyecto es un adaptador de Supabase con la misma interfaz. No cambies esas firmas sin actualizar todas las escenas. Clave actual: `souvenirs-solsticio-demo-v2`. Si cambias la forma del estado, sube la versión de la clave para no mezclar datos viejos.

## Visual

- Un solo canvas WebGL, 480×360, `pixelRatio` 1, sin antialias. El escenario CSS es 960×720 y `main.js` lo escala para que quepa.
- Materiales con `M()` (Phong, `flatShading`) o `B()` (sin luz: focos, pantallas, llamas). Geometría con pocos segmentos.
- Todo objeto es 3D. Menús, botones, la burbuja del duende y el recibo son HTML en `#hud`.
- Fuentes: Press Start 2P (títulos) y VT323 (texto), vía `FONT_TITLE` y `FONT_TEXT`.
- Los objetos 3D son diseños propios del tipo de cosa. Sin logos, sin marcas y sin copiar la silueta firma de un producto real.
- Un modelo nuevo se registra en `MODELOS` (`src/models/index.js`) con `label`, `build`, `color`, `turn` y `fit`. El globo lo escala y lo apoya en la base.

## Crear con IA

La llamada sale del navegador a Anthropic u OpenAI. La llave no pasa por ningún servidor de este proyecto. Por defecto vive en memoria; `localStorage` solo si la persona marca «Recordar».

- Valida siempre con `aDeseo` y `sanitizeParts`. Formas: `box`, `cylinder`, `sphere`, `cone`, `torus`. Máximo 60 piezas.
- Si la respuesta pide un modelo ya hecho (`MODELOS`, distinto de `ia`), no guardes `piezas`.
- Al tocar la CSP de `vercel.json`, conserva `connect-src` hacia `api.anthropic.com`, `api.openai.com` y `*.supabase.co`.
- No subas `.env`. `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` aún no se usan; la seguridad futura es RLS (lectura pública, escritura solo del dueño).

## Al cambiar código

- Cambios chicos, en el archivo que ya posee esa responsabilidad. Una regla nueva va a `rules.js`; un objeto, a `models/`; un formulario, a `hud.js`.
- No agregues dependencias ni un framework si el cambio cabe en el código actual. Three queda fijo en `0.149.0` (el artifact carga esa misma versión por CDN).
- El modo `artifact` externaliza `three`. No importes otra librería global sin actualizar `vite.config.js` y `scripts/to-artifact.mjs`.
- Escapa el HTML del HUD con `esc()` de `ui/hud.js`.
- Precios del seed son marcadores de la demo. No los presentes como datos oficiales.
