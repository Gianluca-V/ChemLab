<script setup>
/**
 * Grupo de chips de selección única — SPEC 04 §3, SPEC 17 §2
 *
 * Cada chip es un <button aria-pressed>. El diseño los renderiza como <span>:
 * un span con manejador de clic no recibe foco, no responde a Enter ni Espacio
 * y no se anuncia como control.
 *
 * 36 px de alto con 8 px de separación, el piso que el documento de diseño fija
 * para chips y acciones en línea.
 */
defineProps({
  /** [{ value, label, hue? }] — `hue` pinta la muestra de color de categoría. */
  options: { type: Array, required: true },
  modelValue: { type: String, required: true },
  legend: { type: String, required: true },
  /** Oculta visualmente el rótulo del grupo sin quitarlo del árbol accesible. */
  hideLegend: { type: Boolean, default: false },
});

defineEmits(['update:modelValue']);
</script>

<template>
  <fieldset class="chips">
    <legend :class="{ 'visually-hidden': hideLegend }">{{ legend }}</legend>

    <div class="chips__row">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="chip"
        :aria-pressed="modelValue === option.value"
        @click="$emit('update:modelValue', option.value)"
      >
        <span
          v-if="option.hue"
          class="chip__swatch"
          aria-hidden="true"
          :style="{ '--cat-hue': `var(--cat-${option.hue})` }"
        />
        {{ option.label }}
      </button>
    </div>
  </fieldset>
</template>

<style scoped>
.chips {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
}

legend {
  padding: 0 0 var(--sp-2);
  color: var(--text-hi);
  font-size: var(--fs-2);
  font-weight: 500;
}

.chips__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  min-height: var(--touch-inline);
  padding: 0 var(--sp-3);
  border: 1px solid var(--border-input);
  border-radius: var(--r-full);
  background: var(--chip-bg);
  color: var(--text-2);
  font-size: var(--fs-2);
  transition:
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease);
}

.chip:hover {
  border-color: var(--border-strong);
  color: var(--text-1);
}

.chip[aria-pressed='true'] {
  border-color: var(--accent);
  background: var(--surface-4);
  color: var(--text-1);
  font-weight: 600;
}

.chip__swatch {
  width: var(--sp-3);
  height: var(--sp-3);
  border-radius: var(--r-sm);
  background: oklch(0.72 0.12 var(--cat-hue));
}
</style>
