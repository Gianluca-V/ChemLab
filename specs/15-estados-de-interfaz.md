# SPEC 15 — Estados de interfaz y componentes transversales

**Estado:** aprobado
**Depende de:** SPEC 09, SPEC 10, SPEC 11, SPEC 12, SPEC 14
**Fuentes:** descripción §26, §36; diseño frames 07, 09, 11, 19, 20, 21, 22, 23, 24
**Componentes:** `ToastHost.vue`, `ConfirmSheet.vue`, `EmptyState.vue`, `ErrorState.vue`, `SkeletonBlock.vue`
**Composable:** `useToast()`

---

## 1. Inventario

Descripción §26: *"Toda operación asíncrona debe contemplar estados."* Y §26 final: *"Cada vista debe tener un estado vacío apropiado."*

| Estado | Componente | Frame | Dónde |
|---|---|---|---|
| Loading | `SkeletonBlock` | 09 | `ResultView`, `CompoundDetailView` |
| Vacío | `EmptyState` | 07, 20, 21 | Laboratorio, Favoritos, Historial |
| Sin resultados | `EmptyState` | 19 | Búsqueda, Resultados |
| Error de red / timeout | `ErrorState` | 22 | `ResultView`, `CompoundDetailView` |
| Error parcial de API | `ErrorState` en línea | 11 | Bloque atribuido a PubChem |
| Sin compuesto registrado | `EmptyState` | 11 | `ResultView` |
| Validación | En línea, `role="alert"` | 13 | `FavoriteDialog` |
| Confirmación destructiva | `ConfirmSheet` | 23 | Favoritos, Historial |
| Éxito | `ToastHost` | 24 | Global |
| Almacenamiento | `ToastHost` | sin frame | Global |

Ninguno de estos errores deja una pantalla inutilizable. Descripción §36: *"Ninguno de estos errores debe provocar una pantalla completamente inutilizable."*

---

## 2. Toasts

Un solo `ToastHost` en `App.vue`, al pie. `useToast()` es su única entrada.

### Anatomía — frame 24

```
┌──────────────────────────────────────┐
│ ✓  Guardado en favoritos             │
│    Agua · 4 de 5 estrellas [Deshacer]│
└──────────────────────────────────────┘
```

- Duración **4 s**, según el diseño.
- `role="status"`, `aria-live="polite"`. No roba el foco.
- Cerrable antes de tiempo con un botón de 44 px.
- `Deshacer` es una acción en línea de 36 px, según la tarjeta de accesibilidad.
- El temporizador se pausa al pasar el mouse por encima o al recibir foco. Un toast que desaparece mientras el usuario va a tocar "Deshacer" es una trampa.

### Reemplazo con acumulación

**Nunca hay más de un toast visible.**

Un toast nuevo **del mismo tipo** dentro de la ventana de 4 s reemplaza al anterior, reinicia el temporizador y acumula el conteo:

```
tap +  Oxígeno            → "Añadido al laboratorio · Oxígeno"
tap +  Hidrógeno  (0,6 s) → "2 añadidos al laboratorio · Oxígeno, Hidrógeno"
tap +  Hidrógeno  (1,1 s) → "3 añadidos al laboratorio · H₂O tentativo"
```

Un toast de **otro tipo** reemplaza sin acumular y arranca su propio conteo.

- A partir de 3 acumulados, la línea secundaria muestra la fórmula tentativa de la mezcla en lugar de enumerar nombres. Enumerar seis elementos no entra en 390 px.
- **`Deshacer` revierte la ráfaga entera**, no el último elemento. El usuario percibió una acción continua; deshacerla en partes no coincide con lo que hizo.
- El snapshot del estado previo se toma al abrirse el primer toast de la ráfaga y vive en memoria mientras el toast está visible.

Por qué no una cola: tres toques en dos segundos producirían doce segundos de toasts contando una historia vieja, con el "Deshacer" del primero apareciendo cuando el usuario ya hizo dos cosas más. Por qué no apilarlos: tres toasts ocupan unos 180 px sobre una pantalla de 844 px, tapando la lista que se sigue tocando, y tres `role="status"` simultáneos se anuncian encimados.

### Tipos

| Tipo | Ejemplo | ¿Deshacer? |
|---|---|---|
| `mixture-add` | `3 añadidos al laboratorio` | sí |
| `mixture-clear` | `Mezcla vaciada` | sí |
| `favorite-save` | `Guardado en favoritos · Agua · 4 de 5 estrellas` | sí |
| `favorite-delete` | `Favorito eliminado` | no — ya confirmó |
| `storage-error` | `No pudimos guardar tus datos en este navegador.` | no |

`favorite-delete` no ofrece deshacer porque la acción pasó por `ConfirmSheet`, cuyo texto declara que es irreversible. Ofrecer deshacer después de haber advertido lo contrario contradice la advertencia.

---

## 3. `ConfirmSheet`

Hoja inferior sobre scrim, **cubriendo la lista sobre la que actúa**. Las filas siguen visibles debajo: el usuario ve el contexto de lo que va a destruir.

```
────────────────────────────────
¿Eliminar «Agua» de favoritos?

Se borran la valoración y la nota que
escribiste. La acción no se puede deshacer:
los favoritos viven solo en este navegador.

[ Cancelar ]          [ Eliminar ]
```

### Reglas

- `<dialog>` nativo con `showModal()`: backdrop, atrapado de foco, Escape e inertización del fondo salen gratis.
- **El foco inicial va a `Cancelar`**, no a la acción destructiva.
- Escape y tocar el scrim cancelan.
- Ambos botones miden 44 px. El destructivo usa `--hazard`.
- El asa de arrastre superior es `aria-hidden="true"`: es una afordancia visual, no un control.

### El texto dice qué se pierde

Nunca "¿Estás seguro?". Siempre: **qué** se destruye, **cuánto**, y **por qué** es irreversible.

| Acción | Título | Cuerpo |
|---|---|---|
| Eliminar favorito | `¿Eliminar «Agua» de favoritos?` | `Se borran la valoración y la nota que escribiste…` |
| Vaciar historial | `¿Vaciar el historial?` | `Se eliminan las 12 entradas de ítems que visitaste…` |

Los conteos son reales, no texto fijo.

### Qué confirma y qué no

| Acción | ¿Confirma? | Por qué |
|---|---|---|
| Eliminar favorito | **sí** | Destruye texto que el usuario escribió |
| Vaciar historial | **sí** | Hasta 100 entradas, irreconstruibles |
| Limpiar mezcla | **no** — deshacer | Estado de trabajo, se rehace en tres toques, acción frecuente |
| Descartar el diálogo de favorito | **no** | Solo se pierde lo tipeado en esa sesión |

> La crítica registró que en el diseño original las acciones destructivas borraban `localStorage` sin confirmación ni deshacer. El frame 23 lo corrigió; acá queda definido **cuándo** aplica cada mecanismo.

---

## 4. `EmptyState`

Un componente con tres partes fijas: ícono, título, explicación de una oración, y **una** acción primaria que resuelve la situación.

| Vista | Título | Acción |
|---|---|---|
| Laboratorio (07) | `Tu mezcla está vacía` | `Abrir tabla periódica` |
| Favoritos (20) | `Todavía no guardaste favoritos` | — |
| Historial (21) | `No hay nada en el historial` | `Explorar la tabla periódica` |
| Cero resultados (19) | `Ningún elemento coincide` | `Limpiar filtros` |
| Sin compuesto (11) | `Sin compuesto registrado` | `Editar mezcla` |

### Previsualización fantasma

Favoritos e Historial muestran, debajo del texto, una silueta de las tarjetas o filas que van a llenar el espacio. Es una decisión del diseño y se conserva: el vacío muestra la forma de lo que falta en vez de un cartel plano.

- `aria-hidden="true"`. Es ilustración, no contenido.
- Usa `--skeleton` como relleno, sin animación: no está cargando nada.

### Mensajes generados

El estado de cero resultados no usa texto fijo: enumera los filtros activos para explicar por qué la intersección es vacía (SPEC 04 §5). Sin eso, el usuario concluye que la aplicación está rota.

---

## 5. `SkeletonBlock` — frame 09

Skeleton, no spinner. Con el texto `Consultando información química…`.

- **Solo cubre el bloque atribuido a PubChem.** Fórmula, nombre, composición y descripción interna se pintan de entrada: son locales y ya están en memoria.
- El contenedor lleva `aria-busy="true"` y `role="status"`.
- **No aparece si la caché está vigente** (SPEC 09 §4). El paso de la mezcla al resultado es inmediato.
- Fondo `--skeleton`, con un pulso suave que respeta `prefers-reduced-motion` (SPEC 14 §8).
- La silueta coincide en dimensiones con el contenido real, para que no haya salto de layout al resolver.

---

## 6. `ErrorState`

Dos formas, según cuánto se pudo mostrar.

### En línea — frame 11

Cuando el compuesto está identificado y falló solo el enriquecimiento:

```
No pudimos obtener información adicional.
Los datos básicos siguen disponibles.
[ Reintentar ]
```

Reemplaza el bloque de PubChem. El resto de la ficha queda intacto.

### De vista — frame 22

Cuando no hay nada que mostrar en el bloque externo:

```
No pudimos consultar PubChem

La red no respondió a tiempo. Tu mezcla H₂O sigue
guardada; volvé a intentar cuando tengas señal.

timeout tras 8 s · intento 2 de 3

[ Reintentar ]        ← primaria
[ Editar mezcla ]     ← secundaria
```

### Reglas comunes

- **`Reintentar` siempre es la acción primaria.** La crítica señaló que en los 20 frames originales no existía ningún "Reintentar"; el frame 22 lo corrigió.
- `role="alert"` — a diferencia del toast, un error sí interrumpe.
- **Ícono SVG además del color.** El color no es el único portador del estado.
- El mensaje varía según el `type` del error (SPEC 09 §3): `offline`, `timeout`, `network`, `http` y `data` dicen cosas distintas.
- Siempre se ofrece una salida además de reintentar. Nunca un callejón sin salida.

---

## 7. Errores de almacenamiento

`localStorage` puede fallar por cuota o por modo privado. Es la quinta categoría de la descripción §36.

| Qué falla | Comportamiento |
|---|---|
| Caché de API | Se descarta en silencio. Es una optimización |
| Favoritos, historial, descubrimientos, mezcla | Toast `storage-error` + el estado en memoria se conserva para la sesión |
| Lectura al arrancar | Se parte de estado vacío. La aplicación funciona |

Descripción §7.2: *"Si `localStorage` falla o está indisponible, la aplicación debe continuar funcionando en modo degradado y mostrar un mensaje apropiado cuando sea relevante."*

Toda lectura y escritura pasa por `storage.js`, envuelta en `try/catch`. Ningún componente toca `localStorage` directamente, así que este manejo existe en un solo lugar.

---

## 8. Foco

Regla transversal, para que ninguna transición de estado deje el foco huérfano.

| Transición | Dónde va el foco |
|---|---|
| Abre `<dialog>` | `Cancelar`, o el primer campo en `FavoriteDialog` |
| Cierra `<dialog>` | Al control que lo abrió |
| Vaciar historial | Encabezado del estado vacío |
| Eliminar el último favorito | Encabezado del estado vacío |
| Aparece un error tras enviar | Primer control inválido |
| Cambio de página en resultados | Encabezado de la lista, no el tope del documento |

Si el foco queda sobre un elemento que se desmonta, el navegador lo devuelve a `<body>` y la navegación por teclado vuelve a empezar desde arriba. Cada caso de arriba existe para evitarlo.
