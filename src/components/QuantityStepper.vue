<script setup>
/**
 * Stepper de cantidad — SPEC 07 §3
 *
 * Tres segmentos de 44 px con radios partidos, tal como el frame 08. Resuelve
 * estequiometría —cantidad, no solo pertenencia— sin inventar un control nuevo.
 *
 * El "−" en cantidad 1 ELIMINA la fila. No baja a 0 dejando una fila fantasma,
 * y su aria-label cambia para decir exactamente eso.
 *
 * La cantidad se anuncia con role="status" al cambiar.
 */
import { computed } from 'vue';

const props = defineProps({
  quantity: { type: Number, required: true },
  /** Nombre en minúscula para el aria-label: "un átomo de hidrógeno". */
  elementName: { type: String, required: true },
  canIncrease: { type: Boolean, default: true },
});

defineEmits(['increase', 'decrease']);

const lowerName = computed(() => props.elementName.toLowerCase());

const decreaseLabel = computed(() =>
  props.quantity === 1
    ? `Quitar el ${lowerName.value} de la mezcla`
    : `Quitar un átomo de ${lowerName.value}`
);
</script>

<template>
  <div class="stepper">
    <button
      type="button"
      class="stepper__minus"
      :aria-label="decreaseLabel"
      @click="$emit('decrease')"
    >
      <span aria-hidden="true">−</span>
    </button>

    <output class="stepper__value mono" role="status">{{ quantity }}</output>

    <button
      type="button"
      class="stepper__plus"
      :aria-label="`Agregar un átomo de ${lowerName}`"
      :aria-disabled="!canIncrease"
      @click="canIncrease && $emit('increase')"
    >
      <span aria-hidden="true">+</span>
    </button>
  </div>
</template>

<style scoped>
.stepper {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid var(--border-input);
  border-radius: var(--r-md);
  background: var(--surface-2);
}

.stepper__minus,
.stepper__plus {
  display: grid;
  place-items: center;
  width: var(--touch);
  height: var(--touch);
  color: var(--text-1);
  font-size: var(--fs-5);
}

.stepper__minus {
  border-radius: var(--r-md) 0 0 var(--r-md);
}

.stepper__plus {
  border-radius: 0 var(--r-md) var(--r-md) 0;
}

.stepper__minus:hover,
.stepper__plus:hover:not([aria-disabled='true']) {
  background: var(--surface-4);
}

.stepper__plus[aria-disabled='true'] {
  opacity: 0.45;
  cursor: not-allowed;
}

.stepper__value {
  display: grid;
  place-items: center;
  min-width: var(--sp-6);
  border-inline: 1px solid var(--border);
  color: var(--text-1);
  font-size: var(--fs-3);
  font-weight: 600;
}
</style>
