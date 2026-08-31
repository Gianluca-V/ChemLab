<script setup>
/**
 * Chips de filtros activos — SPEC 05 §3
 *
 * Solo aparecen los filtros distintos de `all`. Sin filtros activos, la fila no
 * ocupa espacio.
 *
 * El aria-label nombra el filtro que se quita, no dice solo "Quitar": el
 * documento de diseño lo especifica en su tarjeta de accesibilidad.
 */
import { computed } from 'vue';
import { CATEGORY_LABELS_SHORT, STATE_LABELS } from '../services/elements.js';

const props = defineProps({
  criteria: { type: Object, required: true },
});

defineEmits(['remove']);

const chips = computed(() => {
  const { q, cat, group, period, state } = props.criteria;
  const active = [];

  if (q) active.push({ key: 'q', label: `«${q}»` });
  if (cat !== 'all') active.push({ key: 'cat', label: CATEGORY_LABELS_SHORT[cat] });
  if (state !== 'all') active.push({ key: 'state', label: STATE_LABELS[state] });
  if (group !== 'all') active.push({ key: 'group', label: `Grupo ${group}` });
  if (period !== 'all') active.push({ key: 'period', label: `Período ${period}` });

  return active;
});
</script>

<template>
  <ul v-if="chips.length > 0" class="active-filters">
    <li v-for="chip in chips" :key="chip.key" class="active-filters__chip">
      <span>{{ chip.label }}</span>
      <button
        type="button"
        class="active-filters__remove"
        :aria-label="`Quitar el filtro ${chip.label}`"
        @click="$emit('remove', chip.key)"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.active-filters__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  height: var(--touch-inline);
  padding-left: var(--sp-3);
  border: 1px solid var(--border-input);
  border-radius: var(--r-full);
  background: var(--chip-bg);
  color: var(--text-2);
  font-size: var(--fs-2);
}

/* Objetivo táctil independiente dentro del chip. */
.active-filters__remove {
  display: grid;
  place-items: center;
  width: var(--touch-inline);
  height: var(--touch-inline);
  border-radius: var(--r-full);
  color: var(--text-3);
}

.active-filters__remove:hover {
  background: var(--surface-4);
  color: var(--text-1);
}
</style>
