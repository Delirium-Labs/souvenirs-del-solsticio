# Souvenirs del Solsticio

Proyecto #1 de **Delirium Labs**. Una lista de deseos convertida en una tienda de souvenirs nocturna con estética de juego 3D de los noventa: cada deseo es un globo de nieve en la vitrina, comprarlo imprime un recibo y desbloquea logros en la libreta.

## Correr en tu compu

```bash
npm install
npm run dev        # abre http://localhost:5173
```

Requiere Node 18 o más nuevo.

## Qué hay

| Escena | Qué pasa |
| --- | --- |
| Entrada | La cámara avanza hacia la tienda. Toca o pulsa Enter para entrar. |
| Vitrina | Estante de arriba: $1,000 o más. Abajo: lo demás. ◄ ► y ▲▼ para moverte, A para agarrar, B libreta, + deseo. |
| Globo | Arrastra para girarlo. La etiqueta 3D muestra precio, días en vitrina y cuánto falta según el ahorro. |
| Compra | El duende entrega la bolsa, sale el recibo y aparecen los logros nuevos. |
| Libreta | Logros (los bloqueados solo muestran su pista) y un sticker por souvenir. |

Reglas (del PRD): un deseo nuevo llega **escarchado 7 días**; la **nieve de la base** crece con el tiempo en vitrina; comprar **no mueve dinero**, solo registra; lo comprado vive en la libreta.

El menú **DEMO ▾** de la vitrina adelanta el reloj 7 días o reinicia los datos. En el globo, **EDITAR** corrige nombre, precio, categoría, objeto o color.

## Crear con IA (tu propia llave)

El botón **✦ IA** convierte una descripción ("una guitarra eléctrica roja de $700") en un deseo con su objeto 3D hecho de piezas.

- Funciona con una llave de **Anthropic** o de **OpenAI** que pega quien la usa. El modelo se puede cambiar en el formulario.
- La llamada sale directo del navegador al proveedor (`src/ai/souvenir-ai.js`). La llave no pasa por ningún servidor de la tienda; por defecto vive solo en memoria y se guarda en el navegador únicamente si marcas "Recordar".
- La respuesta se valida antes de dibujarse (`src/models/parts.js`): formas permitidas, números acotados, máximo 60 piezas.
- **VER UN EJEMPLO** muestra el resultado sin llave.
- En la vista previa dentro de Claude las llamadas a la IA están bloqueadas; en local (`npm run dev`) y en Vercel sí funcionan. `vercel.json` trae una política CSP que solo permite conectar con Anthropic, OpenAI y Supabase.

## Precios de referencia de la lista

Son marcadores para la demo; corrígelos con **EDITAR**.

| Deseo | Precio | De dónde sale |
| --- | --- | --- |
| iPhone 16 | $699 | Precio de Apple EE. UU. después del iPhone 17 |
| Sony a7 IV (cuerpo) | $1,999.99 | Tienda de Sony EE. UU., octubre 2026 |
| DJI Osmo Pocket 4 | $599 | Precio de lista en EE. UU. |
| BMW 528i xDrive 2016 | $7,736 | Un anuncio usado en EE. UU. (112 mil millas) |
| Subaru WRX STI 2001–2003 | $18,500 | Mediana de importados en jdmbuysell.com |
| Yamaha R15 | $4,500 | Sin dato: pon el precio de la agencia |
| ASUS ROG Zephyrus G16 | $3,000 | Sin dato en EE. UU.: pon el precio real |

Los objetos 3D son diseños propios por tipo (sedán ejecutivo, sedán deportivo, moto deportiva, celular, mirrorless, cámara de bolsillo, laptop gamer), sin logos ni réplicas de marca.

## Estructura

```
src/
  main.js            renderer único (480×360 pixelado), cambio de escenas, puntero y teclado
  engine/lib.js      ayudantes low-poly, texturas de texto, nieve, pinos
  models/            objetos low-poly (detailed.js, moto.js, objects.js), piezas de la IA (parts.js) y el globo (index.js)
  ai/souvenir-ai.js  crear con IA con la llave de cada quien
  scenes/            entrada, vitrina, globo, compra, libreta
  data/rules.js      reglas puras: días, escarcha, nieve, estantes, capítulos, logros
  data/store.js      datos de la demo en el navegador (interfaz async, lista para cambiar a Supabase)
  data/seed.js       datos de ejemplo
  ui/hud.js          HUD 2D y formularios
scripts/to-artifact.mjs   genera la versión de un solo archivo que se publica como demo
```

Convención visual: todo objeto es 3D; los menús, botones, burbuja del duende y el recibo son HUD 2D encima de la escena, como en los juegos de PS1.

## Demo de un solo archivo

```bash
npm run build:artifact   # deja dist-artifact/souvenirs.html
```

## Siguiente paso (ARD)

Supabase para los datos (lectura pública, escritura solo del dueño con RLS) y Vercel para servir la app. `data/store.js` se reemplaza por un adaptador de Supabase con la misma interfaz; las escenas no cambian.
