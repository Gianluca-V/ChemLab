<script setup>
/**
 * Barra fija de mezcla — SPEC 03 §1, SPEC 07 §6, SPEC 16 §4
 *
 * Al pie de /table, solo con mezcla no vacía. Con la mezcla vacía no ocupa
 * espacio.
 *
 * Existe SOLO por debajo de 768 px: con el panel lateral visible duplicaría la
 * información. La condición es una media query, no una comprobación de ancho en
 * JavaScript.
 *
 * Es la única realimentación de que agregar un elemento tuvo efecto mientras el
 * usuario recorre la tabla, junto con el toast.
 */
import { useMixture } from '../composables/useMixture.js';
import ChemFormula from './ChemFormula.vue';

const mixture = useMixture();
</script>

<template>
  <div v-if="!mixture.isEmpty.value" class="mixture-bar">
    <div class="mixture-bar__text">
      <p class="mixture-bar__label">Mezcla actual</p>
      <ChemFormula class="mixture-bar__formula" :formula="mixture.tentativeKey.value" />
    </div>

    <a href="#mixture" class="btn btn--primary">
      Ver mezcla ({{ mixture.totalAtoms.value }})
    </a>
  </div>
</template>

<style scoped>
.mixture-bar {
  position: sticky;
  bottom: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-3);
  border-top: 1px solid var(--border);
  background: var(--surface-2);
}

.mixture-bar__label {
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.mixture-bar__formula {
  color: var(--text-1);
  font-size: var(--fs-5);
}

@media (min-width: 768px) {
  .mixture-bar {
    display: none;
  }
}
</style>
