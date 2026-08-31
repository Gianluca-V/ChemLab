<script setup>
/**
 * Búsqueda y filtros — frames 04 y 19, SPEC 04
 *
 * Filtra EN VIVO sobre el dataset local, sin navegar. "Ver los N resultados"
 * solo hace router.push a /results con los filtros serializados: no envía nada
 * y no consulta nada. PubChem se consulta únicamente al combinar.
 *
 * Los cuatro filtros se combinan con AND y son de selección única.
 */
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import CategoryLegend from '../components/CategoryLegend.vue';
import EmptyState from '../components/EmptyState.vue';
import FilterChips from '../components/FilterChips.vue';
import SearchField from '../components/SearchField.vue';

import {
  DEFAULT_CRITERIA,
  describeEmptyResult,
  hasActiveCriteria,
  searchElements,
  STATE_LABELS,
  toQuery,
} from '../services/elements.js';

const router = useRouter();

const criteria = ref({ ...DEFAULT_CRITERIA });

const stateOptions = [
  { value: 'all', label: 'Todos' },
  ...Object.entries(STATE_LABELS).map(([value, label]) => ({ value, label })),
];

const groups = Array.from({ length: 18 }, (_, i) => String(i + 1));
const periods = Array.from({ length: 7 }, (_, i) => String(i + 1));

const results = computed(() => searchElements(criteria.value));
const count = computed(() => results.value.length);
const isFiltered = computed(() => hasActiveCriteria(criteria.value));

function reset() {
  criteria.value = { ...DEFAULT_CRITERIA };
}

function seeResults() {
  if (count.value === 0) return;
  router.push({ name: 'results', query: toQuery(criteria.value) });
}
</script>

<template>
  <div class="view">
    <SearchField v-model="criteria.q" />

    <CategoryLegend v-model="criteria.cat" />

    <div class="view__selects">
      <!--
        18 y 7 opciones no entran como chips en mobile. El <select> nativo abre
        el selector del sistema operativo, es accesible sin trabajo adicional y
        no requiere JavaScript para desplegarse.
      -->
      <div class="field">
        <label for="group">Grupo</label>
        <select id="group" v-model="criteria.group">
          <option value="all">Todos</option>
          <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
        </select>
      </div>

      <div class="field">
        <label for="period">Período</label>
        <select id="period" v-model="criteria.period">
          <option value="all">Todos</option>
          <option v-for="period in periods" :key="period" :value="period">{{ period }}</option>
        </select>
      </div>
    </div>

    <FilterChips
      v-model="criteria.state"
      :options="stateOptions"
      legend="Estado a temperatura ambiente"
    />

    <!--
      Lantánidos y actínidos tienen group null: quedan excluidos por cualquier
      filtro de grupo distinto de `all`. Es correcto, no pertenecen a ninguno.
    -->
    <p v-if="criteria.group !== 'all'" class="view__hint">
      Lantánidos y actínidos no pertenecen a ningún grupo: quedan fuera de este filtro.
    </p>

    <template v-if="count > 0">
      <p class="view__count" role="status">
        {{ count }} {{ count === 1 ? 'elemento coincide' : 'elementos coinciden' }}
      </p>

      <div class="view__actions">
        <button type="button" class="btn btn--primary" @click="seeResults">
          Ver los {{ count }} resultados
        </button>
        <button
          type="button"
          class="btn btn--ghost"
          :aria-disabled="!isFiltered"
          @click="isFiltered && reset()"
        >
          Limpiar
        </button>
      </div>
    </template>

    <div v-else role="status">
      <EmptyState title="Ningún elemento coincide" :description="describeEmptyResult(criteria)">
        <template #action>
          <button type="button" class="btn btn--primary" @click="reset">Limpiar filtros</button>
        </template>
      </EmptyState>
    </div>
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

.view__count {
  color: var(--text-1);
  font-size: var(--fs-4);
  font-weight: 600;
}

.view__hint {
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.view__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
</style>
