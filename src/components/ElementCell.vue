<script setup>
/**
 * Celda de la tabla periódica — SPEC 03 §3
 *
 * Es un <button type="button"> REAL. El frame 03 renderiza las 118 celdas como
 * <div>: un div clickeable no es alcanzable por teclado, no se anuncia como
 * control y no responde a Enter ni a Espacio.
 *
 * ACCIÓN: tocar la celda AGREGA un átomo a la mezcla.
 *
 * > Desvío registrado respecto de SPEC 03 §6, por decisión del equipo. La SPEC
 * > resolvía "un tap, un destino" y navegaba al detalle, con este motivo: si la
 * > celda agrega a la mezcla, recorrer la tabla no deja rastro y el historial
 * > queda casi vacío. Con este cambio el historial se alimenta solo desde los
 * > resultados de búsqueda, las filas de la mezcla y los chips de sugerencia.
 * > El detalle del elemento pasa a abrirse desde su fila en MixtureRow.
 *
 * Contenido por breakpoint: número atómico, símbolo y nombre en mobile; solo
 * número y símbolo en tablet, donde la celda mide 44×44; los cuatro datos con
 * la masa atómica desde 1024 px, donde vuelve a 56×64.
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
  /** false cuando se alcanzó el límite de 20 por elemento o de 50 átomos. */
  canAdd: { type: Boolean, default: true },
});

const categoryLabel = computed(() => CATEGORY_LABELS_SINGULAR[props.element.category]);

/**
 * El nombre accesible enuncia la ACCIÓN, no solo la identidad: la celda es un
 * botón que agrega a la mezcla, y un lector de pantalla tiene que poder saber
 * qué pasa al activarlo sin haberlo activado.
 */
const label = computed(() => {
  const { name, symbol, atomicNumber, atomicMass } = props.element;
  const identity =
    `${name}, símbolo ${symbol}, número atómico ${atomicNumber}, ` +
    `masa atómica ${atomicMass}, ${categoryLabel.value}`;
  const state = props.quantity > 0 ? `, ${props.quantity} en la mezcla` : '';
  const action = props.canAdd
    ? `. Agregar un átomo de ${name.toLowerCase()} a la mezcla`
    : '. Límite de átomos alcanzado';
  return identity + state + action;
});

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
    :aria-disabled="!canAdd"
    :style="{ ...position, '--cat-hue': `var(--cat-${element.category})` }"
  >
    <span class="cell__z mono" aria-hidden="true">{{ element.atomicNumber }}</span>
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

.cell[aria-disabled='true'] {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.cell__z {
  font-size: var(--fs-1);
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

/* Tablet: la celda es 44×44 y solo entran el número y el símbolo. */
@media (min-width: 768px) {
  .cell__name {
    display: none;
  }

  .cell__symbol {
    font-size: var(--fs-3);
  }
}

/*
  Escritorio: la celda vuelve a 56×64 y muestra los cuatro datos que SPEC 03 §3
  pide para este breakpoint. El padding baja a 2 px para que las cuatro líneas
  entren sin que ningún texto baje del piso de 11 px (SPEC 14 §3, SPEC 17 §8).
*/
@media (min-width: 1024px) {
  .cell {
    padding: 2px var(--sp-1);
  }

  .cell__symbol {
    font-size: var(--fs-4);
  }

  .cell__name,
  .cell__mass {
    display: block;
  }
}
</style>
