# SPEC 03 — Tabla periódica

**Estado:** aprobado
**Depende de:** SPEC 00, SPEC 01, SPEC 02
**Fuentes:** descripción §11, §12, §24; diseño frames 03, 27, 28 y tarjeta "Breakpoints"
**Componentes:** `TableView.vue`, `PeriodicTable.vue`, `ElementCell.vue`, `CategoryLegend.vue`

---

## 1. Composición de `TableView`

En el orden del frame 03, de arriba hacia abajo:

```
TopBar            título "Elementos" + hamburguesa
SearchField       "Buscar símbolo, nombre o número"
FilterChips       Todos · Metales · No metales · Metaloides
CategoryLegend    <details> colapsable, cerrado por defecto   ← agregado, ver §5
"Tabla periódica" + hint "deslizá →"
PeriodicTable     grilla con scroll interno
MixtureBar        "Mezcla actual · H₂O" + [Ver mezcla (3)]    sticky al pie
```

Los chips y el campo de búsqueda de esta vista filtran **la tabla en su lugar**: los elementos que no coinciden se atenúan, no se quitan de la grilla. La estructura del período y el grupo tiene que sobrevivir al filtrado; una tabla periódica con huecos arbitrarios deja de ser una tabla periódica. El filtrado que reordena y colapsa resultados es trabajo de `SearchView` y `ResultsView` (SPEC 04 y 05), que son vistas distintas.

`MixtureBar` solo se muestra cuando la mezcla tiene al menos un átomo. Con la mezcla vacía no ocupa espacio.

---

## 2. Grilla

`display: grid` sobre coordenadas químicas reales, no sobre un array recorrido en orden.

```css
grid-template-columns: repeat(18, var(--cell-w));
grid-template-rows: repeat(7, var(--cell-h)) 8px repeat(2, var(--cell-h));
gap: var(--cell-gap);
```

| Fila de la grilla | Contenido |
|---|---|
| 1–7 | Períodos 1 a 7 |
| 8 | Separador de 8 px. Sin contenido, sin borde |
| 9 | Lantánidos (La–Lu, Z 57–71) |
| 10 | Actínidos (Ac–Lr, Z 89–103) |

**Posicionamiento de cada celda:**

- Elementos del bloque s, p y d: `grid-column: group`, `grid-row: period`. Los campos `group` y `period` de `elements.json` bastan.
- Bloque f (`block === "f"`): `group` es `null`. Se posicionan por fórmula — `grid-row: 9` para lantánidos, `10` para actínidos; `grid-column: atomicNumber − 56` y `atomicNumber − 88` respectivamente, ocupando las columnas 1 a 15.

Las posiciones de la primera fila (H en grupo 1, He en grupo 18) salen solas de los datos. No hay casos especiales cableados.

El separador de 8 px de la fila 8 es el que hace que el bloque f se lea como bloque desprendido y no como dos períodos más. Es una decisión del diseño, no un espaciado incidental.

---

## 3. Celda

Cada celda es un `<button type="button">` real. No un `<div>` con `cursor:pointer`.

> La crítica del documento de diseño detectó que el frame 03 renderiza las 118 celdas como `<div>`. Se corrige acá: son botones. Un `<div>` clickeable no es alcanzable por teclado, no se anuncia como control y no responde a Enter ni Espacio.

### Contenido

| Contexto | Datos visibles |
|---|---|
| ≤1023 px | número atómico · símbolo · nombre |
| ≥1024 px | número atómico · símbolo · nombre · masa atómica |

> **Contradicción #5, resuelta con desvío.** La descripción §11 exige que cada elemento muestre en la tabla número atómico, símbolo, nombre **y masa atómica**. El diseño solo incluye la masa en el frame 28 (desktop); los frames 03 y 27 la omiten.
>
> Se adopta el criterio del diseño. Una celda de 56×64 px que apila cuatro datos obliga a tipografía por debajo del piso de 11 px que el propio documento declara como mínimo legible. La masa atómica sigue siendo accesible sin excepción: aparece en la celda a partir de 1024 px, en el `aria-label` de toda celda en todo breakpoint, y siempre en `ElementDetailView`. El requisito de la descripción se cumple a nivel de sistema; lo que se rechaza es apretarlo dentro de una celda donde vuelve ilegibles a los otros tres.

### Color

El fondo se compone desde el hue de la categoría, sin tabla de traducción intermedia:

```css
background: oklch(0.72 0.09 var(--cat-hue) / 16%);
```

`--cat-hue` se setea por celda desde `element.category`, que ya es la clave corta del token (SPEC 02 §1.1).

**El color nunca es el único portador de la categoría.** La categoría se anuncia en el `aria-label` y se muestra como texto en el detalle. Un usuario que no distingue los diez hues no pierde información.

### Estados

| Estado | Tratamiento |
|---|---|
| Normal | Fondo teñido por categoría |
| Hover | `transform: translateY(-1px)`, transición de 120 ms |
| Focus | Anillo de 2 px del acento, offset 2 px, vía `:focus-visible` |
| Seleccionado en la mezcla | Relleno del acento al 30 %, más un contador `×2` cuando la cantidad es mayor a 1 |
| Atenuado por filtro | `opacity: .35`, sigue siendo focusable y activable |

El estado "seleccionado" usa el acento (hue 300). Los hues de categoría más cercanos son `ln` (330) y `ac` (340), separados por 30° y 40°; el documento de diseño ya desplazó `ng` de 300 a 265 y `ac` de 10 a 340 precisamente para abrir esa distancia. No se los altera.

### Accesibilidad

```html
<button
  type="button"
  class="cell"
  :aria-label="`${name}, símbolo ${symbol}, número atómico ${z}, ${categoryLabel}`"
  :style="{ '--cat-hue': `var(--cat-${category})` }"
>
```

Tamaño táctil: 56×64 px en mobile y 44×44 px desde tablet. Ambos cumplen el piso de 44 px que el documento de diseño fija para acciones de ícono.

---

## 4. Scroll y breakpoints

La descripción §24 lo exige de forma terminante: *"La tabla periódica no debe generar overflow horizontal de toda la aplicación. Si el ancho no permite representar adecuadamente la tabla, el overflow debe estar contenido exclusivamente dentro de su propio componente."*

El contenedor de la grilla lleva `overflow: auto` propio. `body` nunca scrollea en horizontal, en ningún breakpoint.

> El frame 03 del documento de diseño declara `overflow: hidden` sin `overflow-x`, lo que en la práctica impide todo scroll. Es un defecto de la maqueta, no de la especificación: el mismo frame rotula "scroll en ambos ejes" en su figcaption y dibuja el hint "deslizá →". Se implementa la intención declarada.

| Breakpoint | Celda | Gap | Grilla | Contenedor | Scroll |
|---|---|---|---|---|---|
| ≤480 px | 56×64 | 4 px | 1063 × 620 px | ancho 100 %, **alto fijo 408 px** | ambos ejes |
| 481–767 px | 56×64 | 4 px | 1063 × 620 px | alto fijo 408 px | ambos ejes |
| 768–1023 px | 44×44 | 4 px | 860 × 496 px | columna de 544 px | horizontal |
| ≥1024 px | 44×44 | 4 px | 860 × 496 px | columna de 890 px | ninguno |

**Los 408 px de alto son un valor calculado, no elegido:** 6 filas × 64 px + 5 gaps × 4 px + 4 px de gap final. El viewport de scroll termina siempre sobre un borde de fila, de modo que nunca se ve media celda cortada. Si la altura de celda cambia, este número se recalcula; no se lo trata como constante independiente.

**La "tabla completa sin scroll" recién existe a partir de 1024 px**, donde la grilla de 860 px entra en una columna de 890 px. A 834 px (tablet) la grilla sigue midiendo 860 px contra 544 px de columna y necesita scroll horizontal. El documento de diseño lo dice explícitamente y se respeta: no se promete una tabla completa donde no cabe.

**Indicador de scroll.** El hint "deslizá →" acompaña a la tabla mientras haya contenido a la derecha y desaparece al llegar al final. No es decorativo: sin él, siete de dieciocho grupos visibles se leen como si la tabla terminara ahí.

---

## 5. Leyenda de categorías

Componente `CategoryLegend`, presente en **todos** los breakpoints.

> **Hueco de diseño, cubierto.** La leyenda de las diez categorías aparece en los frames de tablet y desktop y en ningún frame de 390 px. En mobile, las celdas quedaban codificadas por color sin ninguna clave que lo descifrara. Diez hues sin leyenda no comunican nada.

**Mobile y tablet:** `<details>` colapsable, cerrado por defecto, ubicado entre los chips de filtro y la tabla.

```html
<details class="legend">
  <summary>Categorías químicas</summary>
  <ul> … 10 ítems: muestra de color + etiqueta … </ul>
</details>
```

Cerrado ocupa 44 px de alto y no afecta al contenedor de 408 px de la tabla. `<summary>` es focusable y operable por teclado de forma nativa, sin JavaScript.

**Desktop (≥1024 px):** siempre expandida, como en el frame 28. No hay razón para ocultarla cuando sobra espacio.

Las diez etiquetas salen del mapa único de `services/elements.js` (SPEC 02 §1.1). No se escriben a mano en el componente.

---

## 6. Interacción

**Tocar una celda navega a `/element/:symbol`.** Un tap, un destino. La celda no se subdivide en zonas táctiles.

Consecuencias buscadas:

1. Toda celda tocada registra historial, por el `afterEach` del router (SPEC 01 §5). Si la celda agregara a la mezcla directamente, explorar la tabla no dejaría rastro y el historial quedaría casi vacío.
2. No hace falta meter un segundo control dentro de 56×64 px. Cualquier botón secundario ahí adentro caería por debajo de los 44 px que el diseño fija como piso.
3. La celda coincide con lo que el frame 03 dibuja: no hay ningún "+" en esas celdas.

**Cómo se agrega a la mezcla, entonces:**

| Origen | Control | Frame |
|---|---|---|
| Detalle de elemento | Botón "Añadir al laboratorio" | 06 |
| Resultados de búsqueda | Botón "+" por fila | 05 |
| Laboratorio | Stepper `− n +` sobre elementos ya presentes | 08 |

**Costo asumido.** Armar H₂O recorriendo solo la tabla exige tres visitas al detalle. Se mitiga en dos puntos:

- "Añadir al laboratorio" **no navega**: agrega, dispara el toast de confirmación (frame 24) y deja al usuario en el detalle. Volver es un solo gesto de back.
- El back a `/table` restaura la posición de scroll interna de la grilla (SPEC 01 §7). El usuario vuelve exactamente a donde estaba, no al hidrógeno.
- La vía de alto volumen es `ResultsView`, donde el "+" agrega sin salir de la lista.

---

## 7. Rendimiento

118 botones se montan una sola vez, con `v-for` sobre el array de elementos y `:key="element.symbol"`.

- **No se remonta la grilla al filtrar.** El filtro solo cambia una clase de atenuación por celda. Vue no toca el DOM más allá del atributo.
- **Un solo listener.** El `@click` se declara en el contenedor de la grilla y se resuelve por delegación leyendo `data-symbol` del `event.target.closest('.cell')`. No se registran 118 listeners.
- La grilla no se re-renderiza al cambiar el breakpoint: las dimensiones de celda son custom properties de CSS y las resuelve el motor de estilos, no JavaScript.
- El componente no observa el resize de la ventana. Todo el comportamiento responsive es CSS.
