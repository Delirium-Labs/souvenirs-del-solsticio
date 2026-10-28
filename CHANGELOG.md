# Registro de cambios

Los cambios importantes de **Souvenirs del Solsticio** se documentan aquí.

## Sin publicar — 2026-10-27

### Añadido

- Rutas con identificadores para conservar el deseo o recibo al recargar (`#globo?id=…` y `#compra?compraId=…`).
- Sincronización del estado entre pestañas y recuperación automática ante datos locales dañados.
- Cancelación real de solicitudes de IA al cerrar el formulario.
- Bloqueo de interacción durante los cambios de escena y recuperación visible si una escena no puede abrirse.
- Delirium Hub en Supabase con esquemas `core` y `souvenirs`, migraciones versionadas, tablas, funciones transaccionales y políticas RLS.
- Acceso del dueño mediante enlace mágico y modo público de solo lectura.
- Vitrina local separada para los visitantes que crean souvenirs con IA.
- Workflow diario para mantener activo Supabase mediante `core.ping()`.

### Cambiado

- Almacén local actualizado a la versión 3, con migración automática desde la versión 2.
- Compras construidas como una sola actualización de estado para evitar pérdidas parciales.
- Identificadores nuevos generados con `crypto.randomUUID()` cuando está disponible.
- `get()` devuelve una copia del estado para que las escenas no puedan mutarlo por accidente.
- El logro **Flor del mediodía** ahora exige no registrar movimientos del ahorro durante diciembre.
- El logro **Vitrina vacía** se registra cuando una compra deja vacío su estante.
- Los formularios modales atrapan el foco, restauran el foco anterior y cierran correctamente con Escape.
- La edición de souvenirs creados con IA aclara que los colores pertenecen a sus piezas.
- La aplicación usa Supabase cuando está configurado y conserva el adaptador local como fallback.
- Vite se actualizó a 5.4.21 sin cambiar la versión mayor del proyecto.
- Supabase Auth ahora usa producción como `site_url` y autoriza los retornos de Vite local para que los enlaces mágicos no terminen en `localhost:3000`.
- La cuenta inicial quedó registrada como dueña de `souvenirs` y se desactivaron las altas de usuarios nuevos.

### Seguridad y robustez

- Validación central de precio, ahorro, categoría, prioridad, modelo, color y piezas antes de persistir.
- Límite de precios y ahorro de USD 1,000,000,000, con redondeo a centavos.
- La llave de IA solo se guarda o reemplaza después de recibir una respuesta válida.
- Un intento fallido de IA ya no elimina una llave recordada previamente.
- Los errores de compra se muestran en la interfaz en lugar de quedar solo en la consola.
- El ahorro remoto solo puede leerlo el dueño; deseos, compras y logros son públicos.
- Las escrituras comprueban `core.es_dueno('souvenirs')` tanto en RLS como en las RPC.
- Se retiró una llave real de OpenAI que se había pegado en `.env.example`; debe revocarse en el proveedor.

### Verificado

- Build normal de Vite y artifact de un solo HTML.
- Navegación directa, recarga de rutas, compra, recibo y logros.
- Recuperación de estado local mal formado.
- Rechazo de precios fuera de rango.
- Cancelación de IA sin crear deseos ni guardar la llave.
- Presentación en escritorio y teléfono vertical.
- Build conectado a Supabase y coincidencia entre migraciones locales e historial remoto.
- Asesores de seguridad de Supabase sin avisos.

## 0.2.0 — 2026-10-27

### Añadido

- Tienda 3D estilo PS1 con escenas de entrada, vitrina, globo, compra y libreta.
- Globos de nieve para cada deseo, escarcha de 7 días y nieve acumulada según el tiempo.
- Dos estantes separados por el precio de USD 1,000.
- Registro de ahorro, compras, recibos, capítulos y logros.
- Datos de demostración persistidos en `localStorage`.
- Edición y creación manual de deseos.
- Creación de souvenirs con Anthropic u OpenAI usando la llave de cada persona.
- Modelos 3D propios y objetos creados por IA mediante primitivas validadas.
- Empaquetado opcional de la demo en un solo archivo HTML.
