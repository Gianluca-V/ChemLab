<script setup>
/**
 * Celda de la tabla periódica — SPEC 03 §3
 *
 * Es un <button type="button"> REAL. El frame 03 renderiza las 118 celdas como
 * <div>: un div clickeable no es alcanzable por teclado, no se anuncia como
 * control y no responde a Enter ni a Espacio.
 *
 * Contenido por breakpoint: número atómico, símbolo y nombre siempre; la masa
 * atómica se suma a partir de 1024 px. La descripción funcional la exigía en
 * todo breakpoint, pero apilar cuatro datos en 56×64 px obliga a tipografía por
 * debajo del piso de 11 px. La masa sigue accesible sin excepción: en el
 * aria-label de toda celda en todo breakpoint, y siempre en el detalle.
 *
 * El color NUNCA es el único portador de la categoría: va también en el
 * aria-label, en la leyenda y como texto en el detalle.
 */
import { computed } from 'vue';
import { CATEGORY_LABELS_SINGULAR } from '../services/elements.js';

const props = defineProps({
  element: { type: Object, required: true },
  /** Cantidad en la mezcla. 0 = no seleccionado. */
  quantity: { type: Number, default: 0 },
  /** Atenuada por el filtro. Sigue siendo focusable y activable. */
  dimmed: { type: Boolean, default: false },
});

const categoryLabel = computed(() => CATEGORY_LABELS_SINGULAR[props.element.category]);

const label = computed(
  () =>
    `${props.element.name}, símbolo ${props.element.symbol}, número atómico ` +
    `${props.element.atomicNumber}, masa atómica ${props.element.atomicMass}, ${categoryLabel.value}` +
    (props.quantity > 0 ? `, ${props.quantity} en la mezcla` : '')
);

/**
 * Posición en la grilla. Los bloques s, p y d salen directo de `group` y
 * `period`. El bloque f tiene `group: null` y se posiciona por fórmula: fila 9
 * para lantánidos, 10 para actínidos, columnas 1 a 15.
 */
const position = computed(() => {
  const { block, group, period, atomicNumber } = props.element;
  if (block !== 'f') return { gridColumn: group, gridRow: period };
  const isLanthanide = atomicNumber <= 71;
  return {
    gridRow: isLanthanide ? 9 : 10,
    gridColumn: atomicNumber - (isLanthanide ? 56 : 88),
  };
});
</script>

<template>
  <button
    type="button"
    class="cell"
    :class="{ 'cell--dimmed': dimmed, 'cell--picked': quantity > 0 }"
    :data-symbol="element.symbol"
    :aria-label="label"
    :style="{ ...position, '--cat-hue': `var(--cat-${element.category})` }"
  >
    <span class="cell__z" aria-hidden="true">{{ element.atomicNumber }}</span>
    <span class="cell__symbol" aria-hidden="true">{{ element.symbol }}</span>
    <span class="cell__name" aria-hidden="true">{{ element.name }}</span>
    <span class="cell__mass mono" aria-hidden="true">{{ element.atomicMass }}</span>
    <span v-if="quantity > 1" class="cell__count mono" aria-hidden="true">×{{ quantity }}</span>
  </button>
</template>

<style scoped>
.cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
  padding: var(--sp-1);
  border: 1px solid var(--border-2);
  border-radius: var(--r-md);
  background: oklch(0.72 0.09 var(--cat-hue) / 16%);
  color: var(--text-2);
  text-align: left;
  transition:
    transform var(--dur-fast) var(--ease),
    box-shadow var(--dur-fast);
}

.cell:hover {
  transform: translateY(-1px);
}

.cell--dimmed {
  opacity: 0.35;
}

.cell--picked {
  border-color: var(--accent);
  background: color-mix(in oklch, var(--accent) 30%, transparent);
  color: var(--text-1);
}

.cell__z {
  font-size: var(--fs-1);
  font-family: var(--font-mono);
  line-height: 1.1;
  color: var(--text-3);
}

.cell__symbol {
  color: var(--text-1);
  font-size: var(--fs-4);
  font-weight: 700;
  line-height: 1.1;
}

/*
  A 11 px un nombre largo como "Rutherfordio" no entra en 56 px de ancho. Se
  trunca: el nombre completo sigue en el aria-label y en el detalle. Un nombre
  truncado y legible es mejor que uno completo e ilegible.
*/
.cell__name {
  max-width: 100%;
  overflow: hidden;
  font-size: var(--fs-1);
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* La masa atómica en la celda recién aparece en desktop. */
.cell__mass {
  display: none;
  color: var(--text-muted);
  font-size: var(--fs-1);
  line-height: 1.1;
}

.cell__count {
  position: absolute;
  top: 2px;
  right: 3px;
  color: var(--accent-soft);
  font-size: var(--fs-1);
  font-weight: 600;
}

/* Desde tablet la celda es 44×44: solo entran el número y el símbolo. */
@media (min-width: 768px) {
  .cell__name {
    display: none;
  }

  .cell__symbol {
    font-size: var(--fs-3);
  }
}

/*
  Desde 1024 px la celda suma la masa atómica. Tres líneas en 44 px de alto
  entran manteniendo el piso de 11 px: 11 + 13 + 11 con interlineado 1.1 son
  38.5 px, más 4 px de padding. Lo que cede es el padding y el cuerpo del
  símbolo, nunca el tamaño del texto (SPEC 14 §3, SPEC 17 §8).
*/
@media (min-width: 1024px) {
  .cell {
    padding: 2px var(--sp-1);
  }

  .cell__symbol {
    font-size: var(--fs-2);
  }

  .cell__mass {
    display: block;
  }
}
</style>
