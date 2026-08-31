<script setup>
/**
 * Laboratorio — frames 03, 07 y 08; SPEC 03 y SPEC 07
 *
 * Sección única. Antes había dos vistas que mostraban lo mismo: /table
 * ("Elementos", con búsqueda, categorías y tabla) y /lab (el panel de mezcla a
 * pantalla completa). Se fusionaron: acá viven la búsqueda, las categorías y la
 * tabla, y la mezcla la renderiza el shell en el panel que acompaña a TODAS las
 * rutas. /table quedó como redirect.
 *
 * Los chips y el campo de búsqueda filtran LA TABLA EN SU LUGAR: los elementos
 * que no coinciden se atenúan, no se quitan de la grilla. La estructura del
 * período y el grupo tiene que sobrevivir al filtrado; una tabla periódica con
 * huecos arbitrarios deja de ser una tabla periódica, porque los huecos son
 * información química.
 *
 * Tocar una celda AGREGA un átomo a la mezcla. El detalle del elemento se abre
 * desde su fila en el panel (ver el desvío registrado en ElementCell).
 */
import { computed, ref } from 'vue';

import CategoryLegend from '../components/CategoryLegend.vue';
import MixtureBar from '../components/MixtureBar.vue';
import PeriodicTable from '../components/PeriodicTable.vue';
import SearchField from '../components/SearchField.vue';

import { allElements, searchElements } from '../services/elements.js';
import { useMixture, MAX_TOTAL_ATOMS } from '../composables/useMixture.js';

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

const canAddMore = computed(() => mixture.totalAtoms.value < MAX_TOTAL_ATOMS);
</script>

<template>
  <div class="view">
    <SearchField v-model="q" id="lab-q" label="Buscar símbolo, nombre o número" />

    <CategoryLegend v-model="cat" />

    <p v-if="hasFilter" class="view__count" role="status">
      {{ matchCount }} {{ matchCount === 1 ? 'elemento coincide' : 'elementos coinciden' }}. El
      resto queda atenuado, no se quita de la grilla.
    </p>

    <section aria-labelledby="grid-heading">
      <h2 id="grid-heading" class="view__section">Tabla periódica</h2>
      <p class="view__hint">Tocá un elemento para sumarlo a tu mezcla.</p>

      <PeriodicTable
        :elements="elements"
        :visible-symbols="visibleSymbols"
        :quantities="mixture.items.value"
        :can-add-more="canAddMore"
        @select="mixture.add"
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
  font-size: var(--fs-4);
}

.view__hint {
  margin: var(--sp-1) 0 var(--sp-3);
  color: var(--text-muted);
  font-size: var(--fs-2);
}
</style>
