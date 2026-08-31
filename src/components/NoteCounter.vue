<script setup>
/**
 * Contador de caracteres de la nota — SPEC 10 §5, SPEC 17 §10
 *
 * NO se anuncia en cada tecla: sería insoportable. Solo al cruzar los umbrales
 * de 180 y de 200, que son los momentos en que el dato cambia una decisión.
 */
import { computed, ref, watch } from 'vue';

const props = defineProps({
  value: { type: Number, required: true },
  max: { type: Number, required: true },
  /** Umbral de aviso previo al tope. */
  warnAt: { type: Number, default: 180 },
});

const announcement = ref('');

const nearLimit = computed(() => props.value >= props.warnAt);

watch(
  () => props.value >= props.max ? 'max' : props.value >= props.warnAt ? 'warn' : 'ok',
  (level, previous) => {
    if (level === previous) return;
    if (level === 'max') announcement.value = `Llegaste al máximo de ${props.max} caracteres.`;
    else if (level === 'warn') announcement.value = `Te quedan ${props.max - props.value} caracteres.`;
    else announcement.value = '';
  }
);
</script>

<template>
  <p class="counter" :class="{ 'counter--warn': nearLimit }">
    <span class="mono" aria-hidden="true">{{ value }} / {{ max }}</span>
    <span class="visually-hidden" aria-live="polite">{{ announcement }}</span>
  </p>
</template>

<style scoped>
.counter {
  color: var(--text-muted);
  font-size: var(--fs-1);
  text-align: right;
}

.counter--warn {
  color: var(--hazard-text);
}
</style>
