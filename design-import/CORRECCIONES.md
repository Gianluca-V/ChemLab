# Correcciones al documento de diseño

> **LEER ANTES DE IMPLEMENTAR CUALQUIER FRAME.**
>
> `ChemLab Mobile First.dc.html` es la **referencia visual** del proyecto: es el único lugar donde existen los 28 frames dibujados, los tokens de color y las tres tarjetas finales.
>
> **No es la fuente de verdad.** La fuente de verdad es `../specs/`.
>
> El archivo de diseño **no fue modificado** y conserva todo lo que se lista abajo. Implementar un frame al pie de la letra, sin cruzar esta tabla, produce código que contradice las SPECs aprobadas.

---

## 1. Copy que cambió

| Frame | El diseño dice | Implementar | Por qué | SPEC |
|---|---|---|---|---|
| 12, 13, 14 | `Tu nota *` (sobre las estrellas) | **`Valoración *`** | "Nota" significaba estrellas en el diseño y texto en la descripción | 10 §1 |
| 12, 13, 14 | `Mensaje corto` | **`Nota`** | ídem | 10 §1 |
| 12, 13 | `Sin nota` (acción) | **`Sin valoración`** | ídem | 10 §4 |
| 13 | `Tenés que elegir una nota de 1 a 5 estrellas.` | **`…una valoración de 1 a 5 estrellas.`** | ídem | 10 §6 |
| 20 | `…con tu nota y tu mensaje.` | **`…con tu valoración y tu nota.`** | ídem | 10 §10 |
| 21 | `…los elementos que visites y las combinaciones que pruebes, agrupados por día.` | **`Acá van a aparecer los elementos y compuestos cuyo detalle visites.`** | Las combinaciones no son historial; no hay agrupación por día | 11 §1, §6 |
| 17 | `3 elementos` / `2 elementos` (pista) | **`3 átomos` / `9 átomos`** | Ambiguo. Se cuentan átomos, igual que el frame 08 | 12 §4 |

---

## 2. Marcado que estaba mal

| Frame | El diseño renderiza | Implementar | SPEC |
|---|---|---|---|
| 03 | Las 118 celdas como `<div>` | **`<button type="button">`** | 03 §3, 17 §2 |
| 03, 04 | Chips de filtro como `<span>` | **`<button aria-pressed>`** | 17 §2 |
| 04 | Los 4 desplegables como `<div>` con glifo "▾" | **`<select>` con `<label>`** | 04 §3.2, 17 §2 |

> La tarjeta de accesibilidad del diseño afirma que todo control interactivo es un elemento real. **Tres de esas cuatro afirmaciones son contradichas por el marcado que tiene arriba.** El chequeo automático los reportó en cero porque solo detecta `<div>` que declaran `cursor: pointer`, y estos no lo declaran.

---

## 3. Estilos que no se transcriben tal cual

| Qué | El diseño | Implementar | Por qué | SPEC |
|---|---|---|---|---|
| Fuentes | `<link>` a Google Fonts | **Autoalojadas en `public/fonts/`, woff2** | Un `<link>` externo rompe el offline exigido por RF14 | 14 §4 |
| Celda: número atómico | `8px` | **`11px` (`--fs-1`)** | Bajo el piso de 11 px que el propio diseño declara | 14 §3 |
| Celda: nombre | `6px` | **`11px` + truncado con elipsis** | ídem. El nombre completo va en `aria-label` y en el detalle | 14 §3 |
| Contenedor de la tabla | `overflow: hidden`, sin `overflow-x` | **`overflow: auto`, scroll en ambos ejes** | El figcaption del mismo frame dice "scroll en ambos ejes" y dibuja el hint "deslizá →". Es un bug de la maqueta contra su propia intención | 03 §4 |
| Tipografía | 18 tamaños distintos (todos los enteros 9→22) | **Escala de 7 pasos** | — | 14 §3 |
| Radios | 20 valores (siete consecutivos entre 9 y 14 px) | **4 pasos: 6 / 11 / 16 / 999** | — | 14 §6 |
| Espaciado | 63,3 % fuera de grilla | **Grilla de 4 px, 7 pasos** | — | 14 §5 |
| Grises | 39 pares de hex a ≤3 por canal | **5 superficies + 4 bordes, cada uno con su rol** | Cuatro grises indistinguibles cumplían una sola función | 14 §2 |

**Los tokens de color del bloque `<style>` sí se transcriben tal cual**, incluidos los diez hues de categoría con `--cat-ng` en 265 y `--cat-ac` en 340 (ya desplazados en el diseño para no colisionar con el acento ni con el rojo de peligro). No se los "corrige" de vuelta a 300 y 10.

---

## 4. Elementos descartados

| Frame | Elemento | Por qué | SPEC |
|---|---|---|---|
| 27 | Lista "Últimos experimentos" (`Na + Cl → NaCl · 14:21`) | No es historial ni descubrimientos; ningún RF lo pide; requiere hora, que se decidió no almacenar. Se reemplaza por el bloque `Descubiertos 8 / 30` que el mismo frame ya incluye | 16 §4 |
| 03, 04 | Chips gruesos `Todos / Metales / No metales / Metaloides` | Reemplazados por las 10 categorías finas. "Metales" agrupa 6 hues y no puede tener color propio | 04 §3.1 |
| 16 | Encabezados de día (`Hoy`) y `{{ h.time }}` | El historial no almacena fecha ni hora | 11 §2 |

---

## 5. Lo que el diseño no cubre

Ningún frame define esto. Está especificado en las SPECs.

| Falta | Resolución | SPEC |
|---|---|---|
| Estado de estrella **llena** — no existe en los 28 frames | `★` con `--star-on` + toast de confirmación | 06 §4 |
| Leyenda de categorías en mobile — solo está en tablet y desktop | `<details>` colapsable en todos los breakpoints, fusionado con los chips de filtro | 03 §5, 04 §6 |
| Estado deshabilitado de `COMBINAR` | `aria-disabled` + motivo enunciado al lado | 07 §4 |
| Límites superiores en cualquier control | 20 por elemento · 50 átomos · 200 caracteres | 07 §1 |
| Paginación con más de 2 páginas | Ventana deslizante con elipsis, hasta 12 páginas | 05 §5 |
| Pantalla 404 | `EmptyState` con el chrome estándar | 01 §2 |
| Enlace de salto al contenido | `skip-link` como primer focusable | 17 §9 |
| Botón de instalar la PWA | `InstallPrompt` condicional a `beforeinstallprompt` | 13 §A.4, 18 §7 |
| `prefers-reduced-motion` | Todas las transiciones desactivables | 14 §8 |
| Mobile landscape (481–767 px) | Derivado de las reglas de portrait, sin componentes nuevos | 16 §7 |
| Íconos de la PWA | 192 · 512 · maskable-512, desde la marca "C ChemLab" | 18 §2 |

---

## 6. Lo que sí se respeta al pie de la letra

Para que quede claro qué **no** hay que reinterpretar:

- Los tokens de color completos, en ambos temas, con sus contrastes anotados.
- Los diez hues de categoría química, con sus desplazamientos.
- La grilla de la tabla: 18 columnas, 7 períodos, separador de 8 px, bloque f en filas 9–10.
- Las dimensiones de celda por breakpoint: 56×64 en mobile, 44×44 desde tablet.
- Los 408 px de alto del contenedor de la tabla — valor calculado: 6 filas × 64 + 5 gaps × 4 + 4.
- El stepper con radios partidos `11px 0 0 11px` / `0 11px 11px 0`, 44 px por segmento.
- El bloque "Qué significan estas propiedades" del frame 06, íntegro.
- Los estados vacíos con previsualización fantasma de los frames 20 y 21.
- La hoja de confirmación del frame 23, cubriendo la lista sobre la que actúa.
- El toast de 4 s con `Deshacer` del frame 24.
- El piso táctil: 44 px en acciones primarias, destructivas y de ícono; 36 px con 8 px de separación en chips y acciones en línea.
- `role="radiogroup"` con cinco `role="radio"` para la valoración.
- Los cuatro breakpoints y sus dimensiones.
- El modo hash del router — el frame 28 dibuja `chemlab.app/#/lab`.
- El TTL de 7 días y el timeout de 8 s.
- Los datos ficticios de contacto del frame 18.
