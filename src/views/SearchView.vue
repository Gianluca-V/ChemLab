<script setup>
/**
 * Búsqueda y filtros — frames 04 y 19, SPEC 04
 *
 * Los resultados se muestran ACÁ MISMO, paginados.
 *
 * > Desvío registrado respecto de SPEC 04 §4, por decisión del equipo. La SPEC
 * > mostraba un contador y un botón "Ver los N resultados" que navegaba a
 * > /results. Se descarta: esconder 118 elementos detrás de un botón obliga a
 * > un paso extra para ver lo que el filtro ya calculó. Si hay que limitar
 * > cuántos se traen de una vez, eso lo resuelve la paginación, que ya existe.
 *
 * El estado sigue viviendo en la QUERY STRING, no en el componente. Es lo que
 * mantiene los tres motivos de SPEC 01 §4: el back devuelve al usuario a su
 * búsqueda con los filtros intactos, la URL es compartible y reproducible, y
 * ninguna vista necesita estado compartido con otra.
 *
 * Se usa `replace` y no `push` al cambiar un filtro: teclear "oxígeno" no debe
 * dejar siete entradas en el historial del navegador. Cambiar de página sí usa
 * `push`, porque ahí el back entre páginas es lo que el usuario espera.
 *
 * Filtra sobre el dataset LOCAL. No consulta PubChem: eso pasa solo al combinar.
 */
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ActiveFilterChips from '../components/ActiveFilterChips.vue';
import CategoryLegend from '../components/CategoryLegend.vue';
import EmptyState from '../components/EmptyState.vue';
import FilterChips from '../components/FilterChips.vue';
import Pagination from '../components/Pagination.vue';
import ResultCard from '../components/ResultCard.vue';
import SearchField from '../components/SearchField.vue';

import {
  DEFAULT_CRITERIA,
  describeEmptyResult,
  hasActiveCriteria,
  normalizeCriteria,
  searchElements,
  STATE_LABELS,
  toQuery,
} from '../services/elements.js';
import { useMixture } from '../composables/useMixture.js';

/** Fijo en todos los breakpoints: la misma URL tiene que dar el mismo listado. */
const PER_PAGE = 10;

const route = useRoute();
const router = useRouter();
const mixture = useMixture();

const listHeading = ref(null);

const criteria = computed(() => normalizeCriteria(route.query));
const results = computed(() => searchElements(criteria.value));
const totalPages = computed(() => Math.max(1, Math.ceil(results.value.length / PER_PAGE)));

const page = computed(() => {
  const requested = Number(route.query.page);
  if (!Number.isInteger(requested) || requested < 1) return 1;
  return Math.min(requested, totalPages.value);
});

const pageItems = computed(() =>
  results.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE)
);

const isFiltered = computed(() => hasActiveCriteria(criteria.value));

const rangeLabel = computed(() => {
  const total = results.value.length;
  if (total === 0) return 'Ningún elemento coincide';
  if (total <= PER_PAGE) {
    return `${total} ${total === 1 ? 'elemento coincide' : 'elementos coinciden'}`;
  }
  const from = (page.value - 1) * PER_PAGE + 1;
  const to = Math.min(page.value * PER_PAGE, total);
  return `Mostrando ${from}–${to} de ${total}`;
});

const stateOptions = [
  { value: 'all', label: 'Todos' },
  ...Object.entries(STATE_LABELS).map(([value, label]) => ({ value, label })),
];

const groups = Array.from({ length: 18 }, (_, i) => String(i + 1));
const periods = Array.from({ length: 7 }, (_, i) => String(i + 1));

/**
 * Escribe un filtro en la query. Reinicia siempre a la página 1: conservar la
 * página 6 tras cambiar el conjunto de resultados lleva a un segmento
 * arbitrario.
 *
 * @param {string} key
 * @param {string} value
 */
function setFilter(key, value) {
  router.replace({ name: 'search', query: toQuery({ ...criteria.value, [key]: value }) });
}

function reset() {
  router.replace({ name: 'search', query: {} });
}

/**
 * El foco va al encabezado de la lista, no al tope del documento: los filtros
 * activos siguen visibles (SPEC 15 §8).
 *
 * @param {number} next
 */
async function goToPage(next) {
  if (next < 1 || next > totalPages.value) return;
  await router.push({ name: 'search', query: toQuery(criteria.value, next) });
  await nextTick();
  listHeading.value?.focus();
}

/**
 * Página fuera de rango: se corrige con `replace` para que arreglar la URL no
 * genere una entrada de historial que rompa el back.
 */
watch([() => route.query.page, totalPages], () => {
  const requested = Number(route.query.page);
  const isMalformed =
    route.query.page !== undefined &&
    (!Number.isInteger(requested) || requested < 1 || requested > totalPages.value);
  if (isMalformed) {
    router.replace({ name: 'search', query: toQuery(criteria.value, page.value) });
  }
});

/** @param {string} symbol */
function open(symbol) {
  router.push({ name: 'element', params: { symbol } });
}
</script>

<template>
  <div class="view">
    <SearchField
      :model-value="criteria.q"
      @update:model-value="setFilter('q', $event)"
    />

    <CategoryLegend
      :model-value="criteria.cat"
      @update:model-value="setFilter('cat', $event)"
    />

    <div class="view__selects">
      <!--
        18 y 7 opciones no entran como chips en mobile. El <select> nativo abre
        el selector del sistema operativo, es accesible sin trabajo adicional y
        no requiere JavaScript para desplegarse.
      -->
      <div class="field">
        <label for="group">Grupo</label>
        <select
          id="group"
          :value="criteria.group"
          @change="setFilter('group', $event.target.value)"
        >
          <option value="all">Todos</option>
          <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
        </select>
      </div>

      <div class="field">
        <label for="period">Período</label>
        <select
          id="period"
          :value="criteria.period"
          @change="setFilter('period', $event.target.value)"
        >
          <option value="all">Todos</option>
          <option v-for="period in periods" :key="period" :value="period">{{ period }}</option>
        </select>
      </div>
    </div>

    <FilterChips
      :model-value="criteria.state"
      :options="stateOptions"
      legend="Estado a temperatura ambiente"
      @update:model-value="setFilter('state', $event)"
    />

    <!--
      Lantánidos y actínidos tienen group null: quedan excluidos por cualquier
      filtro de grupo distinto de `all`. Es correcto, no pertenecen a ninguno.
    -->
    <p v-if="criteria.group !== 'all'" class="view__hint">
      Lantánidos y actínidos no pertenecen a ningún grupo: quedan fuera de este filtro.
    </p>

    <div class="view__toolbar">
      <p ref="listHeading" class="view__range" role="status" tabindex="-1">{{ rangeLabel }}</p>
      <button
        type="button"
        class="btn btn--inline btn--ghost"
        :aria-disabled="!isFiltered"
        @click="isFiltered && reset()"
      >
        Limpiar
      </button>
    </div>

    <ActiveFilterChips :criteria="criteria" @remove="setFilter($event, DEFAULT_CRITERIA[$event])" />

    <template v-if="results.length > 0">
      <ul class="view__results">
        <ResultCard
          v-for="element in pageItems"
          :key="element.symbol"
          :element="element"
          :quantity="mixture.quantityOf(element.symbol)"
          :can-add="mixture.canAdd(element.symbol)"
          @open="open"
          @add="mixture.add"
        />
      </ul>

      <Pagination :page="page" :total-pages="totalPages" @go="goToPage" />
    </template>

    <EmptyState
      v-else
      title="Ningún elemento coincide"
      :description="describeEmptyResult(criteria)"
    >
      <template #action>
        <button type="button" class="btn btn--primary" @click="reset">Limpiar filtros</button>
      </template>
    </EmptyState>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.view__selects {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

label {
  color: var(--text-hi);
  font-size: var(--fs-2);
  font-weight: 500;
}

select {
  min-height: var(--touch);
  padding: 0 var(--sp-3);
  border: 1px solid var(--border-input);
  border-radius: var(--r-md);
  background: var(--surface-2);
  color: var(--text-1);
  font-size: var(--fs-3);
}

.view__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}

.view__range {
  color: var(--text-1);
  font-size: var(--fs-4);
  font-weight: 600;
}

.view__range:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}

.view__hint {
  color: var(--text-muted);
  font-size: var(--fs-1);
}

/* La cantidad por página no cambia: cambia cómo se distribuyen (SPEC 05 §6). */
.view__results {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-2);
}

@media (min-width: 481px) {
  .view__results {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .view__results {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
