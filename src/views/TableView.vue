<script setup>
/**
 * Tabla periódica — frame 03, SPEC 03
 *
 * Los chips y el campo de búsqueda de esta vista filtran LA TABLA EN SU LUGAR:
 * los elementos que no coinciden se atenúan, no se quitan de la grilla. La
 * estructura del período y el grupo tiene que sobrevivir al filtrado; una tabla
 * periódica con huecos arbitrarios deja de ser una tabla periódica, porque los
 * huecos son información química.
 *
 * El filtrado que reordena y colapsa resultados es trabajo de SearchView y
 * ResultsView, que son vistas distintas.
 *
 * Tocar una celda navega al detalle. Un tap, un destino: la celda no se
 * subdivide en zonas táctiles, y así toda celda tocada registra historial por
 * el afterEach del router.
 */
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import CategoryLegend from '../components/CategoryLegend.vue';
import MixtureBar from '../components/MixtureBar.vue';
import PeriodicTable from '../components/PeriodicTable.vue';
import SearchField from '../components/SearchField.vue';

import { allElements, searchElements } from '../services/elements.js';
import { useMixture } from '../composables/useMixture.js';

const router = useRouter();
const mixture = useMixture();

const elements = allElements();
const q = ref('');
const cat = ref('all');

const hasFilter = computed(() => q.value !== '' || cat.value !== 'all');

/**
 * Símbolos que pasan el filtro. `null` cuando no hay filtro activo: así
 * PeriodicTable no atenúa nada y no recorre 118 comparaciones de más.
 */
const visibleSymbols = computed(() => {
  if (!hasFilter.value) return null;
  return new Set(searchElements({ q: q.value, cat: cat.value }).map((e) => e.symbol));
});

const matchCount = computed(() => visibleSymbols.value?.size ?? elements.length);

/** @param {string} symbol */
function open(symbol) {
  router.push({ name: 'element', params: { symbol } });
}
</script>

<template>
  <div class="view">
    <SearchField v-model="q" id="table-q" label="Buscar símbolo, nombre o número" />

    <CategoryLegend v-model="cat" />

    <p v-if="hasFilter" class="view__count" role="status">
      {{ matchCount }} {{ matchCount === 1 ? 'elemento coincide' : 'elementos coinciden' }}. El
      resto queda atenuado, no se quita de la grilla.
    </p>

    <section aria-labelledby="grid-heading">
      <h2 id="grid-heading" class="view__section">Tabla periódica</h2>
      <PeriodicTable
        :elements="elements"
        :visible-symbols="visibleSymbols"
        :quantities="mixture.items.value"
        @select="open"
      />
    </section>

    <MixtureBar />
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.view__count {
  color: var(--text-3);
  font-size: var(--fs-2);
}

.view__section {
  margin-bottom: var(--sp-2);
  font-size: var(--fs-4);
}
</style>
