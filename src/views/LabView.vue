<script setup>
/**
 * Laboratorio — frames 07 y 08, SPEC 07; comportamiento de ancho en SPEC 16 §4
 *
 * La ruta /lab sobrevive en todos los anchos: sigue siendo una URL válida y
 * compartible.
 *
 *   ≤767 px  MixturePanel a pantalla completa.
 *   ≥768 px  El <aside> del shell ya muestra la mezcla, así que el área
 *            principal aprovecha el espacio con la tabla en lugar de repetir el
 *            panel.
 *
 * No hay redirección: la ruta se resuelve siempre igual y lo único que cambia
 * es qué componente ocupa el área principal, decidido por una media query y no
 * por JavaScript.
 */
import { useRouter } from 'vue-router';

import MixturePanel from '../components/MixturePanel.vue';
import PeriodicTable from '../components/PeriodicTable.vue';
import { allElements } from '../services/elements.js';
import { useMixture } from '../composables/useMixture.js';

const router = useRouter();
const mixture = useMixture();
const elements = allElements();

/** @param {string} symbol */
function open(symbol) {
  router.push({ name: 'element', params: { symbol } });
}
</script>

<template>
  <div class="lab">
    <div class="lab__panel">
      <MixturePanel variant="view" />
    </div>

    <section class="lab__table" aria-labelledby="lab-grid-heading">
      <h2 id="lab-grid-heading" class="lab__section">Tabla periódica</h2>
      <PeriodicTable
        :elements="elements"
        :quantities="mixture.items.value"
        @select="open"
      />
    </section>
  </div>
</template>

<style scoped>
.lab__table {
  display: none;
}

.lab__section {
  margin-bottom: var(--sp-2);
  font-size: var(--fs-4);
}

@media (min-width: 768px) {
  .lab__panel {
    display: none;
  }

  .lab__table {
    display: block;
  }
}
</style>
