<script setup>
import { usePwaInstall } from '../composables/usePwaInstall.js';

const { canInstall, promptInstall } = usePwaInstall();
</script>

<template>
  <button v-if="canInstall" type="button" class="btn btn--ghost install-prompt" @click="promptInstall">
    Instalar ChemLab
  </button>
</template>

<style scoped>
.install-prompt {
  align-self: flex-start;
}
</style>
