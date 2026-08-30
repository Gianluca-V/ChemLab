# ChemLab — Especificaciones

Especificación técnica completa de ChemLab, resuelta en una sesión de decisiones punto por punto.

**Precedencia:** estas SPECs prevalecen sobre ambos documentos de origen. Todo desvío está registrado en la SPEC correspondiente, con su motivo.

---

## Índice

| # | SPEC | Cubre |
|---|---|---|
| 00 | [Stack y arquitectura](00-stack-y-arquitectura.md) | Vue 3 + Vite, composables, capas, claves de `localStorage` |
| 01 | [Routing y navegación](01-routing-y-navegacion.md) | 12 rutas en modo hash, query string, registro de historial |
| 02 | [Contratos de datos](02-contratos-de-datos.md) | `elements.json`, `compounds.json`, notación de Hill, modelos persistidos |
| 03 | [Tabla periódica](03-tabla-periodica.md) | Grilla, celda, scroll por breakpoint, leyenda |
| 04 | [Búsqueda y filtros](04-busqueda-y-filtros.md) | Búsqueda local, 4 filtros, cero resultados |
| 05 | [Resultados y paginación](05-resultados-y-paginacion.md) | 10 por página, ventana con elipsis, columnas |
| 06 | [Detalle](06-detalle.md) | Elemento y compuesto, `CompoundInfo`, estrella de favorito |
| 07 | [Laboratorio y mezcla](07-laboratorio-y-mezcla.md) | Steppers, guarda de COMBINAR, límites |
| 08 | [Motor de combinación](08-motor-de-combinacion.md) | Normalización, exacta y reducida, sugerencias |
| 09 | [PubChem, caché y estados](09-pubchem-cache-y-estados-asincronos.md) | API, TTL 7 días, reintentos, taxonomía de errores |
| 10 | [Favoritos](10-favoritos.md) | Valoración, nota de 200, validación, confirmación |
| 11 | [Historial](11-historial.md) | Solo detalles visitados, dedup de consecutivos |
| 12 | [Descubrimientos](12-descubrimientos.md) | Progreso, banner, pista de bloqueados |
| 13 | [Home y contacto](13-home-y-contacto.md) | Punto de entrada, mapa OSM, instalación |
| 14 | [Design system](14-design-system.md) | Tokens, escalas, temas, fuentes autoalojadas |
| 15 | [Estados de interfaz](15-estados-de-interfaz.md) | Toasts, hojas, vacíos, errores, foco |
| 16 | [Responsive y layout](16-responsive-y-layout.md) | 4 breakpoints, panel lateral persistente |
| 17 | [Accesibilidad](17-accesibilidad.md) | Controles reales, teclado, contraste, anuncios |
| 18 | [PWA](18-pwa.md) | Manifest, Service Worker propio, offline, actualización |
| 19 | [Requisitos y aceptación](19-requisitos-y-aceptacion.md) | RF1–RF14, RNF1–RNF10, criterios de aceptación, defensa, límites |

---

## Cómo leer este repositorio

**Orden de precedencia, de mayor a menor:**

1. `specs/` — fuente de verdad. Prevalece sobre todo lo demás.
2. `design-import/CORRECCIONES.md` — qué del diseño no se implementa tal cual.
3. `design-import/ChemLab Mobile First.dc.html` — referencia visual: los 28 frames, los tokens de color, las dimensiones.

> ⚠️ **El documento de diseño no fue modificado.** Conserva copy, marcado y estilos que las SPECs corrigen. **Leer `design-import/CORRECCIONES.md` antes de implementar cualquier frame.**

---

## Procedencia

Estas SPECs se derivaron de dos documentos:

| Documento | Estado |
|---|---|
| **Descripción funcional** — 45 secciones: requisitos, modelo de datos, restricciones, criterios de aceptación | **Ya no se versiona.** Absorbido: lo normativo en SPEC 19, el resto distribuido en SPECs 00–18 |
| **Documento de diseño** — 28 frames, tokens, tarjetas de breakpoints, persistencia y accesibilidad | Conservado en `design-import/`, **sin modificar**. Solo referencia visual |

Una auditoría del documento de diseño previa a estas SPECs está en [`docs/critica-diseno.md`](../docs/critica-diseno.md). Justifica varias decisiones —la leyenda en mobile, las celdas como `<button>`, la escala tipográfica, el estado de estrella llena— y su puntaje **no describe el estado actual del proyecto**.

Las SPECs citan la descripción por número de sección (`descripción §6.3`, `§24`, `§42`). Esas referencias apuntan al documento de origen, **que ya no está en el repositorio**: se conservan porque documentan de dónde salió cada requisito y porque su contenido está transcrito en la SPEC que las cita — sobre todo en SPEC 19, que reproduce íntegras las secciones normativas.

**No hay que ir a buscar ese archivo.** Si una referencia `descripción §N` no se entiende por sí sola, el contenido está en SPEC 19.

---

## Decisiones tomadas

| # | Decisión | SPEC |
|---|---|---|
| 1 | Vue 3 + Vite, en desvío explícito de la §3.2 | 00 |
| 2 | Composables propios, sin Pinia. Todo persiste en `localStorage` | 00 |
| 3 | `/element/:symbol` y `/compound/:formula` separadas | 01 |
| 4 | Notación de Hill como clave canónica | 02 |
| 5 | Tap en celda navega al detalle. Un tap, un destino | 03 |
| 6 | Leyenda colapsable, fusionada con los chips de filtro | 03 / 04 |
| 7 | Filtro por las 10 categorías finas, no 6 agrupaciones | 04 |
| 8 | Paginación numerada con ventana y elipsis | 05 |
| 9 | Estrella de favorito en el `TopBar` del detalle | 06 |
| 10 | COMBINAR se habilita con ≥2 átomos | 07 |
| 11 | Matching exacto primero, reducido después | 08 |
| 12 | 1 reintento automático, luego manual hasta 3 | 09 |
| 13 | Modelo `rating`/`note`, UI "Valoración"/"Nota" | 10 |
| 14 | Historial sin timestamp; colapsa solo consecutivos | 11 |
| 15 | Pista de bloqueados en átomos totales | 12 |
| 16 | Contacto con datos ficticios del diseño | 13 |
| 17 | Escalas normalizadas de tipografía, espaciado y radios | 14 |
| 18 | Toasts con reemplazo y acumulación | 15 |
| 19 | Panel de mezcla persistente en ≥768 px, por CSS | 16 |
| 20 | Service Worker propio con `injectManifest` | 18 |

---

## Contradicciones resueltas

Entre la descripción funcional de origen y el documento de diseño. Las ocho quedaron zanjadas; ninguna sigue abierta.

| # | Conflicto | Resolución | SPEC |
|---|---|---|---|
| 1 | Claves `chemlab:favorites` vs `chemlab_favorites` | Guión bajo, del diseño | 00 §5 |
| 2 | Historial: ¿solo detalles, o también experimentos? | Solo detalles visitados, de ambos tipos | 11 §1 |
| 3 | 6 rutas en la descripción vs 9 pantallas en el diseño | 12 rutas más catch-all | 01 §2 |
| 4 | Dataset de 20 vs progreso "8 / 30" | 30 compuestos | 02 §2 |
| 5 | Masa atómica exigida en la celda, ausente en mobile | En celda desde 1024 px; siempre en `aria-label` y detalle | 03 §3 |
| 6 | 6 filtros propuestos vs 4 dibujados | Los 4 del diseño. RF2 pide 3 | 04 §3 |
| 7 | Favorito exigido en el detalle, ausente en el frame 06 | Estrella en el `TopBar` de ambos detalles | 06 §4 |
| 8 | "Nota" significa estrellas en uno y texto en el otro | `rating` = Valoración, `note` = Nota | 10 §1 |

---

## Huecos del diseño cubiertos

Cosas que ningún frame resolvía y que las SPECs definen.

| Hueco | Resolución | SPEC |
|---|---|---|
| Sin estado de estrella llena en 20 frames | Estado `★` + toast de confirmación | 06 §4 |
| Leyenda de categorías ausente en todos los frames de 390 px | Presente en todos los breakpoints | 03 §5 |
| COMBINAR sin estado deshabilitado | `aria-disabled` con motivo enunciado | 07 §4 |
| Sin límites superiores en ningún control | 20 por elemento, 50 átomos, 200 caracteres | 07 §1 |
| 118 celdas como `<div>`, chips como `<span>` | Controles reales en todos los casos | 17 §2 |
| `overflow: hidden` impidiendo el scroll declarado | Scroll en ambos ejes, contenido en su componente | 03 §4 |
| Tipografía de 6 px y 8 px bajo el piso de 11 px | Escala de 7 pasos con piso en 11 px | 14 §3 |
| Fuentes desde Google Fonts, incompatible con offline | Autoalojadas y precacheadas | 14 §4 |
| Sin `prefers-reduced-motion` | Todas las transiciones desactivables | 14 §8 |
| Sin pantalla 404 | `EmptyState` con el chrome estándar | 01 §2 |
| Sin enlace de salto al contenido | `skip-link` como primer focusable | 17 §9 |
| Sin botón de instalación de PWA | `InstallPrompt` condicional | 13 §A.4 |
| Comportamiento de la paginación con 12 páginas | Ventana deslizante con elipsis | 05 §5 |

---

## Descartado del diseño

| Elemento | Motivo | SPEC |
|---|---|---|
| "Últimos experimentos" del frame 27 | No es historial ni descubrimientos; ningún RF lo pide; requiere hora | 16 §4 |
| Chips gruesos "Metales / No metales / Metaloides" | Sustituidos por las 10 categorías finas | 04 §3.1 |
| Agrupación del historial por día | Sin timestamp no hay dato | 11 §2 |
| `discoveredAt` | Ninguna pantalla lo muestra | 12 §2 |

---

## Pendientes antes de implementar

1. **Verificar el nombre de la propiedad SMILES en PubChem PUG REST.** Fue renombrada; según la versión vigente puede ser `SMILES` o `ConnectivitySMILES`. Pedir una propiedad inexistente devuelve HTTP 400, no un campo vacío. (SPEC 09 §3)
2. **Construir `elements.json`** con los 118 elementos y los 17 campos, incluidos `hazard` y `glossary`, con `null` explícito donde no aplique. (SPEC 02 §1)
3. **Construir `compounds.json`** con 30 entradas: los 20 obligatorios de la §6.2 más 10, cada uno con su `key` de Hill verificada y su `query` en inglés. (SPEC 02 §2, SPEC 09 §2)
4. **Diseñar los íconos** 192, 512 y `maskable-512` a partir de la marca "C ChemLab". (SPEC 18 §2)
5. **Descargar y subsetear las fuentes** Space Grotesk y IBM Plex Mono a `woff2`. (SPEC 14 §4)
