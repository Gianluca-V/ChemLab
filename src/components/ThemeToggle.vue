<script setup>
/**
 * Cambio de tema — SPEC 14 §7
 *
 * En el drawer, "Tema" NO es un enlace: es este control, que invoca useTheme().
 * El estado se enuncia en palabras además de en el ícono, porque el color y la
 * forma no pueden ser los únicos portadores.
 */
import { computed } from 'vue';
import { useTheme } from '../composables/useTheme.js';

const { resolved, toggle } = useTheme();

const label = computed(() =>
  resolved.value === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
);
</script>

<template>
  <button type="button" class="theme-toggle" :aria-label="label" @click="toggle">
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        v-if="resolved === 'dark'"
        d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.5 8.5 0 1 0 20 14.2Z"
        fill="currentColor"
      />
      <g v-else fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
      </g>
    </svg>
    <span class="theme-toggle__text">Tema</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  min-width: var(--touch);
  min-height: var(--touch);
  padding: 0 var(--sp-2);
  border-radius: var(--r-md);
  color: var(--text-2);
}

.theme-toggle:hover {
  background: var(--surface-3);
  color: var(--text-1);
}

svg {
  width: var(--sp-5);
  height: var(--sp-5);
}

/* En el TopBar solo se ve el ícono; en el drawer se acompaña con la palabra. */
.theme-toggle__text {
  display: none;
  font-size: var(--fs-3);
}

.theme-toggle--labelled .theme-toggle__text {
  display: inline;
}
</style>
