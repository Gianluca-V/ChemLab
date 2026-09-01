<script setup>
/**
 * Historial — frames 16, 21, 23; SPEC 11
 *
 * Lista plana, sin fecha ni hora: el orden del array es toda la información
 * temporal que se guarda (SPEC 11 §2). El nombre se resuelve contra el dataset
 * al renderizar; una entrada cuyo id ya no exista se omite (SPEC 11 §4).
 */
import { computed, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';

import ConfirmSheet from '../components/ConfirmSheet.vue';
import EmptyState from '../components/EmptyState.vue';

import { getElement } from '../services/elements.js';
import { getCompoundByFormula } from '../services/compounds.js';
import { useHistory } from '../composables/useHistory.js';

const router = useRouter();
const history = useHistory();
const emptyState = ref(null);

/** Resuelve una entrada de historial contra el dataset. Null si ya no existe. */
function resolve(entry) {
  if (entry.type === 'element') {
    const element = getElement(entry.id);
    return element ? { ...entry, name: element.name, kind: 'elemento' } : null;
  }
  const compound = getCompoundByFormula(entry.id);
  return compound ? { ...entry, name: compound.name, kind: 'compuesto' } : null;
}

const rows = computed(() => history.items.value.map(resolve).filter(Boolean));

/** @param {{type: string, id: string}} entry */
function open(entry) {
  if (entry.type === 'element') {
    router.push({ name: 'element', params: { symbol: entry.id } });
  } else {
    router.push({ name: 'compound', params: { formula: entry.id } });
  }
}

const confirmOpen = ref(false);

async function confirmClear() {
  history.clear();
  confirmOpen.value = false;
  await nextTick();
  emptyState.value?.focus();
}
</script>

<template>
  <div class="history">
    <div class="history__head">
      <h1>Historial</h1>
      <p class="visually-hidden" role="status">Historial, {{ rows.length }} entradas</p>
      <button
        v-if="rows.length > 0"
        type="button"
        class="btn btn--inline btn--ghost"
        @click="confirmOpen = true"
      >
        Vaciar
      </button>
    </div>

    <ol v-if="rows.length > 0" class="history__list">
      <li v-for="(entry, index) in rows" :key="`${entry.type}:${entry.id}:${index}`">
        <button
          type="button"
          class="row"
          :aria-label="`Ver el detalle de ${entry.name}, ${entry.kind}`"
          @click="open(entry)"
        >
          <span class="row__name">{{ entry.name }}</span>
          <span class="row__kind">{{ entry.kind }}</span>
        </button>
      </li>
    </ol>

    <EmptyState
      v-else
      ref="emptyState"
      icon="🕘"
      title="No hay nada en el historial"
      description="Acá van a aparecer los elementos y compuestos cuyo detalle visites."
      :ghosts="2"
      focusable
    >
      <template #action>
        <RouterLink :to="{ name: 'lab' }" class="btn btn--primary">
          Explorar la tabla periódica
        </RouterLink>
      </template>
    </EmptyState>

    <ConfirmSheet
      :open="confirmOpen"
      title="¿Vaciar el historial?"
      :body="`Se eliminan las ${rows.length} entradas de ítems que visitaste. La acción no se puede deshacer: el historial vive solo en este navegador.`"
      confirm-label="Vaciar"
      @confirm="confirmClear"
      @close="confirmOpen = false"
    />
  </div>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.history__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.history__list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  min-height: var(--touch);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  text-align: left;
}

.row:hover {
  background: var(--surface-3);
}

.row__name {
  color: var(--text-1);
  font-size: var(--fs-3);
  font-weight: 500;
}

.row__kind {
  color: var(--text-muted);
  font-size: var(--fs-1);
}
</style>
