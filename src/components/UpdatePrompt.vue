<script setup>
import { usePwaUpdate } from '../composables/usePwaUpdate.js';

const { updateAvailable, applyUpdate } = usePwaUpdate();
</script>

<template>
  <div v-if="updateAvailable" class="update-prompt" role="status" aria-live="polite">
    <p class="update-prompt__text">Hay una nueva versión de ChemLab disponible.</p>
    <button type="button" class="btn btn--primary btn--inline" @click="applyUpdate">Actualizar</button>
  </div>
</template>

<style scoped>
.update-prompt {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
  padding: var(--sp-3);
  border-bottom: 1px solid var(--border-strong);
  background: var(--surface-3);
  box-shadow: var(--shadow-2);
}

.update-prompt__text {
  color: var(--text-1);
  font-size: var(--fs-3);
}
</style>
