<script setup>
/**
 * Grilla de la tabla periódica — SPEC 03 §2, §4, §7
 *
 * display: grid sobre COORDENADAS QUÍMICAS REALES, no sobre un array recorrido
 * en orden. Las posiciones de la primera fila —H en el grupo 1, He en el 18—
 * salen solas de los datos: no hay casos especiales cableados.
 *
 * Rendimiento:
 *   · 118 botones se montan UNA sola vez. Filtrar no remonta la grilla: solo
 *     cambia una clase de atenuación por celda.
 *   · UN solo listener. El click se resuelve por delegación leyendo data-symbol
 *     del closest('.cell'). No se registran 118 listeners.
 *   · El componente no observa el resize. Las dimensiones de celda son custom
 *     properties y las resuelve el motor de estilos.
 *
 * Scroll: el contenedor lleva overflow propio. El body NUNCA scrollea en
 * horizontal, en ningún breakpoint. El frame 03 declara `overflow: hidden`, que
 * impide todo scroll; su propio figcaption dice "scroll en ambos ejes" y dibuja
 * el hint. Se implementa la intención declarada, no el defecto de la maqueta.
 */
import { computed, onActivated, onMounted, ref } from 'vue';
import { MAX_PER_ELEMENT } from '../composables/useMixture.js';
import ElementCell from './ElementCell.vue';

const props = defineProps({
  elements: { type: Array, required: true },
  /** Símbolos que pasan el filtro. `null` = sin filtro activo. */
  visibleSymbols: { type: Object, default: null },
  /** Cantidades de la mezcla, para el estado seleccionado. */
  quantities: { type: Object, default: () => ({}) },
  /** false cuando la mezcla llegó al tope de 50 átomos totales. */
  canAddMore: { type: Boolean, default: true },
});

const emit = defineEmits(['select']);

const viewport = ref(null);
const atEnd = ref(true);

/**
 * Posición de scroll conservada internamente: volver desde un detalle de
 * elemento devuelve al usuario exactamente a donde estaba, no al hidrógeno
 * (SPEC 01 §7, SPEC 03 §6).
 */
let savedScroll = { left: 0, top: 0 };

function onScroll() {
  const element = viewport.value;
  if (!element) return;
  savedScroll = { left: element.scrollLeft, top: element.scrollTop };
  atEnd.value = element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;
}

function restoreScroll() {
  const element = viewport.value;
  if (!element) return;
  element.scrollLeft = savedScroll.left;
  element.scrollTop = savedScroll.top;
  onScroll();
}

onMounted(restoreScroll);
onActivated(restoreScroll);

/**
 * Delegación: un único manejador para las 118 celdas.
 * @param {MouseEvent} event
 */
function onClick(event) {
  const cell = event.target.closest('.cell');
  if (!cell?.dataset.symbol) return;
  if (cell.getAttribute('aria-disabled') === 'true') return;
  emit('select', cell.dataset.symbol);
}

/** @param {string} symbol */
function isDimmed(symbol) {
  return props.visibleSymbols !== null && !props.visibleSymbols.has(symbol);
}

/** @param {string} symbol */
function canAdd(symbol) {
  return props.canAddMore && (props.quantities[symbol] ?? 0) < MAX_PER_ELEMENT;
}
</script>

<template>
  <!--
    El degradado del borde derecho reemplaza al texto "deslizá →" del frame 03.

    > Desvío registrado respecto de SPEC 03 §4, por decisión del equipo. La SPEC
    > exige un indicador de scroll y da un motivo que sigue valiendo: sin él,
    > siete de dieciocho grupos se leen como si la tabla terminara ahí. Lo que
    > se descarta es la COPY, no la función: "deslizá" describe un gesto táctil
    > y en escritorio no se desliza. El degradado señala lo mismo sin enunciar
    > un gesto que no corresponde al dispositivo, y desaparece al llegar al
    > final igual que el texto que reemplaza.
  -->
  <div class="table" :class="{ 'table--more': !atEnd }">
    <div ref="viewport" class="table__viewport" @scroll="onScroll">
      <div class="table__grid" @click="onClick">
        <ElementCell
          v-for="element in elements"
          :key="element.symbol"
          :element="element"
          :quantity="quantities[element.symbol] ?? 0"
          :dimmed="isDimmed(element.symbol)"
          :can-add="canAdd(element.symbol)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
  La superficie propia separa la grilla del fondo de la página. Sin ella, las
  celdas —que son tintes al 16 % del hue de su categoría— flotaban sobre el
  fondo del viewport sin ningún borde que las contuviera y el conjunto perdía
  contraste.
*/
.table {
  position: relative;
  overflow: hidden;
  padding: var(--sp-2);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
}

/*
  Alto fijo de 408 px: 6 filas × 64 + 5 gaps × 4 + 4 de gap final. El viewport
  termina siempre sobre un borde de fila, así que nunca se ve media celda
  cortada. Si la altura de celda cambia, este número se recalcula.
*/
.table__viewport {
  width: 100%;
  height: var(--table-viewport-h);
  overflow: auto;
  overscroll-behavior: contain;
}

.table__grid {
  display: grid;
  grid-template-columns: repeat(18, var(--cell-w));
  /* Fila 8: separador de 8 px que desprende el bloque f. Sin contenido. */
  grid-template-rows: repeat(7, var(--cell-h)) var(--sp-2) repeat(2, var(--cell-h));
  gap: var(--cell-gap);
  width: max-content;
}

/* Indicador de que hay contenido a la derecha. Puramente decorativo. */
.table--more::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--sp-6);
  pointer-events: none;
  background: linear-gradient(to right, transparent, var(--surface-2));
}

/*
  Mobile landscape: en 481–767 px la altura disponible es la restricción, no el
  ancho. El alto fijo cede a un máximo relativo (SPEC 16 §7).
*/
@media (min-width: 481px) and (max-height: 600px) {
  .table__viewport {
    height: auto;
    max-height: 60vh;
  }
}

/* Tablet: la grilla mide 860 px y necesita scroll horizontal contenido. */
@media (min-width: 768px) {
  .table__viewport {
    height: auto;
    overflow-x: auto;
    overflow-y: hidden;
  }
}

/*
  El overflow-x: auto SE MANTIENE en escritorio. Con la sidebar de 240 px y el
  panel de 360 px, un viewport de 1280 px deja al área principal en unos 616 px
  contra los 1076 px que mide la grilla con celdas de 56 px. Con
  `overflow: visible` la tabla se derramaba POR DEBAJO del panel lateral y las
  columnas 14 a 18 quedaban tapadas, que es exactamente lo que SPEC 03 §4
  prohíbe: el overflow tiene que quedar contenido en su propio componente.
*/
</style>
