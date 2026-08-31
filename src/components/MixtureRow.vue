<script setup>
/**
 * Fila de la mezcla — SPEC 07 §3
 *
 * Número atómico, símbolo, nombre, tag de peligro cuando `hazard` no es null,
 * el botón que abre el detalle y el stepper.
 *
 * El botón de detalle es la vía por la que se llega a /element/:symbol desde el
 * laboratorio: con el tap de la celda reasignado a "agregar a la mezcla", ésta
 * es la puerta al detalle y, por lo tanto, al registro de historial.
 *
 * El tag de peligro es información de seguridad y viene del dataset. NO se
 * omite por falta de espacio. Describe la propiedad del elemento, jamás un
 * resultado de mezclarlo con otro (SPEC 07 §7).
 */
import QuantityStepper from './QuantityStepper.vue';

defineProps({
  element: { type: Object, required: true },
  quantity: { type: Number, required: true },
  canIncrease: { type: Boolean, default: true },
});

defineEmits(['increase', 'decrease', 'open']);
</script>

<template>
  <li class="row">
    <span class="row__z mono" aria-hidden="true">{{ element.atomicNumber }}</span>

    <div class="row__text">
      <p class="row__head">
        <span class="row__symbol">{{ element.symbol }}</span>
        <span class="row__name">{{ element.name }}</span>
      </p>

      <p v-if="element.hazard" class="row__hazard">
        <span aria-hidden="true">{{ element.hazard.icon }}</span>
        {{ element.hazard.label }}
      </p>
    </div>

    <button
      type="button"
      class="row__detail"
      :aria-label="`Ver el detalle de ${element.name}`"
      @click="$emit('open', element.symbol)"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path
          d="M12 10.6v6M12 7.6v.1"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
    </button>

    <QuantityStepper
      :quantity="quantity"
      :element-name="element.name"
      :can-increase="canIncrease"
      @increase="$emit('increase', element.symbol)"
      @decrease="$emit('decrease', element.symbol)"
    />
  </li>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) 0;
  border-bottom: 1px solid var(--border);
}

.row__z {
  flex: none;
  width: var(--sp-5);
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.row__text {
  flex: 1;
  min-width: 0;
}

.row__head {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
  min-width: 0;
}

.row__symbol {
  color: var(--text-1);
  font-size: var(--fs-4);
  font-weight: 700;
}

.row__name {
  overflow: hidden;
  color: var(--text-2);
  font-size: var(--fs-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row__hazard {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  margin-top: var(--sp-1);
  padding: 0 var(--sp-2);
  border-radius: var(--r-sm);
  background: color-mix(in oklch, var(--hazard) 18%, transparent);
  color: var(--hazard-text);
  font-size: var(--fs-1);
  line-height: 1.7;
}

.row__detail {
  flex: none;
  display: grid;
  place-items: center;
  width: var(--touch);
  height: var(--touch);
  border-radius: var(--r-md);
  color: var(--text-3);
}

.row__detail:hover {
  background: var(--surface-3);
  color: var(--text-1);
}

.row__detail svg {
  width: var(--sp-5);
  height: var(--sp-5);
}
</style>
