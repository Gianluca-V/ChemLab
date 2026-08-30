# SPEC 05 — Resultados y paginación

**Estado:** aprobado
**Depende de:** SPEC 01, SPEC 02, SPEC 04
**Fuentes:** descripción §16, §24, RF3; diseño frame 05 y tarjeta "Breakpoints"
**Componentes:** `ResultsView.vue`, `ResultCard.vue`, `Pagination.vue`, `ActiveFilterChips.vue`

---

## 1. Composición

En el orden del frame 05:

```
TopBar                título "Resultados" + hamburguesa
"14 encontrados"
ActiveFilterChips     No metales ✕   Gas ✕
lista de ResultCard   10 por página
Pagination            ‹ 1 2 3 … 12 ›
```

---

## 2. La URL es el estado

`ResultsView` **no tiene estado propio de filtrado**. Lee `route.query` (SPEC 01 §4), aplica los mismos predicados que `SearchView` sobre el dataset local y renderiza el segmento correspondiente a `page`.

Consecuencias:

- Recargar la página con la URL pegada reproduce exactamente el mismo listado.
- El back del navegador entre páginas funciona sin trabajo adicional: cada cambio de página es un `router.push`.
- No hace falta compartir estado entre `SearchView` y `ResultsView`. Ningún composable interviene en el filtrado.

Cambiar de página o quitar un filtro se hace siempre con `router.push`, nunca mutando una variable local.

### Query inválida

| Caso | Comportamiento |
|---|---|
| `page` mayor al total de páginas | Se ajusta a la última página, con `router.replace` |
| `page` no numérico o menor a 1 | Se ajusta a 1, con `router.replace` |
| `cat`, `state` con valor desconocido | Se ignora ese filtro |
| `group`, `period` fuera de rango | Se ignora ese filtro |

Se usa `replace` y no `push` para que corregir la URL no genere una entrada de historial del navegador que rompa el back.

---

## 3. Chips de filtros activos

Cada filtro activo se muestra como un chip con un botón de quitar, según el frame 05.

```html
<button class="chip-remove" aria-label="Quitar el filtro No metales">✕</button>
```

- Solo aparecen los filtros distintos de `all`. Sin filtros activos, la fila no ocupa espacio.
- Quitar un chip hace `router.push` con esa clave eliminada de la query **y `page` reiniciada a 1**. Conservar la página 6 tras ampliar el conjunto de resultados lleva a un segmento arbitrario.
- El `aria-label` nombra el filtro que se quita, no dice solo "Quitar" — el diseño lo especifica en su tarjeta de accesibilidad.
- El chip completo mide 36 px de alto, con el botón de quitar como objetivo táctil independiente dentro de él.

---

## 4. Tarjeta de resultado

```
┌─────────────────────────────────────┐
│  8   O                              │
│      Oxígeno                   [ + ]│
│      No metal · 15.999 u            │
└─────────────────────────────────────┘
```

| Zona | Contenido | Acción |
|---|---|---|
| Cuerpo de la tarjeta | número atómico, símbolo, nombre, meta | Navega a `/element/:symbol` |
| Botón `+` | 44×44 px, esquina derecha | Agrega 1 átomo a la mezcla |

`meta` es `categoría · masa atómica`. Acá la masa **sí** se muestra en todos los breakpoints: la tarjeta tiene ancho completo y no sufre la restricción de la celda de 56×64 px que motivó el desvío de SPEC 03 §3.

El cuerpo y el `+` son dos `<button>` hermanos, no anidados. Un botón dentro de otro botón es HTML inválido y produce comportamiento indefinido.

### El botón `+`

- Agrega un átomo del elemento a `useMixture()`.
- Dispara el toast de confirmación (SPEC 15).
- **No navega.** El usuario sigue en la lista y puede agregar varios elementos seguidos. Esta es la vía de alto volumen para armar una mezcla, frente al recorrido por el detalle que describe SPEC 03 §6.
- Si el elemento ya está en la mezcla, incrementa su cantidad y el botón muestra el conteo: `+ 2`.
- `aria-label`: `Añadir Oxígeno al laboratorio`.

---

## 5. Paginación

10 resultados por página, fijo en todos los breakpoints.

Descripción §16: *"La consigna exige mostrar inicialmente los primeros 10 resultados y proporcionar un mecanismo para acceder a los restantes."*

### Ventana deslizante

Se muestran siempre: la primera página, la última, la actual y sus dos vecinas. Los tramos omitidos se colapsan en una elipsis.

```
14 resultados → 2 páginas
  ‹  【1】 2  ›

118 resultados → 12 páginas
  página 1 :  ‹ 【1】 2  3  …  12 ›
  página 6 :  ‹  1  … 5 【6】 7 …  12 ›
  página 12:  ‹  1  … 10 11 【12】 ›
```

**Ancho máximo en el peor caso:** 7 controles interactivos de 44 px + 2 elipsis de 20 px + 8 gaps de 4 px = 380 px. Entra en el ancho de contenido de 356 px de una pantalla de 390 px con un ajuste de gap a 2 px, o con scroll horizontal contenido en el propio control. El ancho es constante a partir de la página 3: la barra no salta de tamaño al navegar.

La elipsis es un `<span aria-hidden="true">`, no un botón. No es un control y no debe recibir foco.

### Accesibilidad

```html
<nav aria-label="Paginación de resultados">
  <button aria-label="Página anterior" :disabled="page === 1">‹</button>
  <a aria-current="page">6</a>
  <a aria-label="Ir a la página 7">7</a>
  <button aria-label="Página siguiente" :disabled="page === total">›</button>
</nav>
```

- La página actual lleva `aria-current="page"`, según la tarjeta de accesibilidad del diseño.
- Las flechas se deshabilitan en los extremos. No se ocultan: un control que desaparece desplaza el resto de la barra.
- Cada número tiene un objetivo táctil de 44 px, aunque el dígito sea más angosto.

### Anuncio del cambio

Al cambiar de página, el encabezado "N encontrados" se actualiza a `Mostrando 11–20 de 118` dentro de un contenedor con `role="status"`. Sin esto, un usuario de lector de pantalla no percibe que la lista cambió: el foco no se mueve solo.

El scroll vuelve al inicio de la lista, no al tope del documento: los filtros activos siguen visibles.

---

## 6. Columnas por breakpoint

Según la tarjeta "Breakpoints" del diseño y la descripción §24:

| Ancho | Tarjetas por fila |
|---|---|
| ≤480 px | 1 |
| 481–767 px | 2 |
| 768–1023 px | 3 |
| ≥1024 px | 4 |

```css
.results { display: grid; grid-template-columns: 1fr; gap: 8px; }
@media (min-width: 481px)  { .results { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 768px)  { .results { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1024px) { .results { grid-template-columns: repeat(4, 1fr); } }
```

**El número de resultados por página no cambia con el breakpoint.** Diez son diez en mobile y en desktop; lo único que cambia es cómo se distribuyen. Si la cantidad dependiera del ancho, la misma URL mostraría contenido distinto según el dispositivo y `?page=6` dejaría de ser reproducible.

---

## 7. Cero resultados

`ResultsView` es alcanzable con una query que no arroja nada —por URL pegada o por quitar el término y dejar filtros excluyentes—. Reutiliza el estado de cero resultados de SPEC 04 §5, con el mismo mensaje generado, y agrega una acción secundaria "Volver a la búsqueda" que navega a `/search` conservando la query.

La paginación no se renderiza cuando el total es 0 o 1 página. Un control de paginación de una sola página es ruido.
