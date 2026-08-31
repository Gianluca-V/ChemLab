<script setup>
/**
 * Barra de progreso de descubrimientos — SPEC 16 §4
 *
 * El color no es el único portador: el texto `8 / 30` acompaña siempre a la
 * barra (SPEC 17 §7).
 */
import { computed } from 'vue';

const props = defineProps({
  value: { type: Number, required: true },
  max: { type: Number, required: true },
  label: { type: String, default: 'Descubiertos' },
});

const percent = computed(() => (props.max === 0 ? 0 : (props.value / props.max) * 100));
</script>

<template>
  <div class="progress">
    <div class="progress__head">
      <span>{{ label }}</span>
      <span class="mono">{{ value }} / {{ max }}</span>
    </div>

    <div
      class="progress__rail"
      role="progressbar"
      :aria-valuenow="value"
      :aria-valuemin="0"
      :aria-valuemax="max"
      :aria-label="`${label}: ${value} de ${max}`"
    >
      <div class="progress__fill" :style="{ width: `${percent}%` }" />
    </div>
  </div>
</template>

<style scoped>
.progress {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.progress__head {
  display: flex;
  justify-content: space-between;
  gap: var(--sp-2);
  color: var(--text-3);
  font-size: var(--fs-2);
}

.progress__rail {
  height: var(--sp-2);
  overflow: hidden;
  border-radius: var(--r-full);
  background: var(--chip-bg);
}

.progress__fill {
  height: 100%;
  border-radius: var(--r-full);
  background: var(--accent);
  transition: width var(--dur) var(--ease);
}
</style>
