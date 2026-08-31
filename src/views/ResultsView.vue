<script setup>
/**
 * Resultados y paginación — frame 05, SPEC 05
 *
 * LA URL ES EL ESTADO. Esta vista no tiene estado propio de filtrado: lee
 * route.query, aplica los mismos predicados que SearchView sobre el dataset
 * local y renderiza el segmento correspondiente a `page`.
 *
 * Consecuencias: recargar con la URL pegada reproduce el mismo listado, el back
 * del navegador entre páginas funciona sin trabajo adicional, y ningún
 * composable interviene en el filtrado.
 *
 * 10 resultados por página, FIJO en todos los breakpoints. Si la cantidad
 * dependiera del ancho, la misma URL mostraría contenido distinto según el
 * dispositivo y ?page=6 dejaría de ser reproducible. Lo único que cambia con el
 * breakpoint es cómo se distribuyen.
 */
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ActiveFilterChips from '../components/ActiveFilterChips.vue';
import EmptyState from '../components/EmptyState.vue';
import Pagination from '../components/Pagination.vue';
import ResultCard from '../components/ResultCard.vue';

import {
  DEFAULT_CRITERIA,
  describeEmptyResult,
  normalizeCriteria,
  searchElements,
  toQuery,
} from '../services/elements.js';
import { useMixture } from '../composables/useMixture.js';

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

const rangeLabel = computed(() => {
  const total = results.value.length;
  if (total === 0) return 'Ningún resultado';
  const from = (page.value - 1) * PER_PAGE + 1;
  const to = Math.min(page.value * PER_PAGE, total);
  return total <= PER_PAGE
    ? `${total} ${total === 1 ? 'encontrado' : 'encontrados'}`
    : `Mostrando ${from}–${to} de ${total}`;
});

/**
 * Query inválida: se corrige con `replace` y no con `push`, para que arreglar
 * la URL no genere una entrada de historial del navegador que rompa el back.
 */
watch(
  [() => route.query, totalPages],
  () => {
    const requested = Number(route.query.page);
    const isMalformed =
      route.query.page !== undefined &&
      (!Number.isInteger(requested) || requested < 1 || requested > totalPages.value);

    const normalized = toQuery(criteria.value, page.value);
    const differs =
      isMalformed || JSON.stringify(normalized) !== JSON.stringify({ ...route.query });

    if (differs) router.replace({ name: 'results', query: normalized });
  },
  { immediate: true }
);

/**
 * El foco va al encabezado de la lista, no al tope del documento: los filtros
 * activos siguen visibles (SPEC 15 §8).
 *
 * @param {number} next
 */
async function goToPage(next) {
  if (next < 1 || next > totalPages.value) return;
  await router.push({ name: 'results', query: toQuery(criteria.value, next) });
  await nextTick();
  listHeading.value?.focus();
}

/** @param {string} key */
function removeFilter(key) {
  // Quitar un filtro reinicia la página a 1: conservar la página 6 tras ampliar
  // el conjunto de resultados lleva a un segmento arbitrario.
  const next = { ...criteria.value, [key]: DEFAULT_CRITERIA[key] };
  router.push({ name: 'results', query: toQuery(next) });
}

/** @param {string} symbol */
function open(symbol) {
  router.push({ name: 'element', params: { symbol } });
}
</script>

<template>
  <div class="view">
    <!--
      Destino del foco al cambiar de página: no el tope del documento, así los
      filtros activos siguen visibles. Al ser role="status" y llevar el rango,
      enfocarlo anuncia exactamente lo que cambió (SPEC 05 §5, SPEC 15 §8).
    -->
    <p ref="listHeading" class="view__range" role="status" tabindex="-1">{{ rangeLabel }}</p>

    <ActiveFilterChips :criteria="criteria" @remove="removeFilter" />

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
        <div class="view__actions">
          <RouterLink
            class="btn btn--primary"
            :to="{ name: 'search', query: toQuery(criteria) }"
          >
            Volver a la búsqueda
          </RouterLink>
        </div>
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

.view__range:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}

.view__range {
  color: var(--text-3);
  font-size: var(--fs-3);
}

/* La cantidad por página no cambia: cambia cómo se distribuyen (SPEC 05 §6). */
.view__results {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-2);
}

.view__actions {
  display: flex;
  gap: var(--sp-2);
}

@media (min-width: 481px) {
  .view__results {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 768px) {
  .view__results {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .view__results {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
