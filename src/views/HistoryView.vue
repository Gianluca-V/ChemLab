<script setup>
/**
 * Historial — frames 16, 21, 23; SPEC 11
 *
 * Lista plana, sin fecha ni hora: el orden del array es toda la información
 * temporal que se guarda (SPEC 11 §2). El nombre se resuelve contra el dataset
 * al renderizar; una entrada cuyo id ya no exista se omite (SPEC 11 §4).
 *
 * Sin <h1>: el único de la página lo pone el TopBar (SPEC 17 §9).
 */
import { computed, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';

import ConfirmSheet from '../components/ConfirmSheet.vue';
import EmptyState from '../components/EmptyState.vue';
import ItemThumb from '../components/ItemThumb.vue';

import { cachedImages } from '../services/cache.js';
import { getElement } from '../services/elements.js';
import { getCompoundByFormula } from '../services/compounds.js';
import { useHistory } from '../composables/useHistory.js';

const router = useRouter();
const history = useHistory();
const emptyState = ref(null);

/*
  Índice de estructuras ya cacheadas, leído UNA vez al montar la vista. No es
  reactivo a propósito: la caché solo cambia al visitar un detalle, y volver acá
  remonta la vista.
*/
const images = cachedImages();

/** Resuelve una entrada de historial contra el dataset. Null si ya no existe. */
function resolve(entry) {
  if (entry.type === 'element') {
    const element = getElement(entry.id);
    if (!element) return null;
    return {
      ...entry,
      name: element.name,
      kind: 'elemento',
      symbol: element.symbol,
      category: element.category,
      formula: '',
      image: '',
    };
  }

  const compound = getCompoundByFormula(entry.id);
  if (!compound) return null;
  return {
    ...entry,
    name: compound.name,
    kind: 'compuesto',
    symbol: '',
    category: '',
    formula: compound.formula,
    image: images.get(compound.key) ?? '',
  };
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
      <!--
        El total va en un role="status" para que vaciar se anuncie. El prefijo
        oculto reconstruye el enunciado que pide SPEC 11 §7 —"Historial, 12
        entradas"— sin repetir en pantalla el título que ya muestra el TopBar.
      -->
      <h2 class="history__count" role="status">
        <span class="visually-hidden">Historial, </span>
        {{ rows.length }} {{ rows.length === 1 ? 'entrada' : 'entradas' }}
      </h2>
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
          <ItemThumb
            :type="entry.type"
            :symbol="entry.symbol"
            :category="entry.category"
            :formula="entry.formula"
            :image="entry.image"
          />

          <span class="row__text">
            <span class="row__name">{{ entry.name }}</span>
            <span class="row__kind">{{ entry.kind }}</span>
          </span>

          <svg class="row__chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="m9 5 7 7-7 7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
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
  gap: var(--sp-3);
}

.history__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.history__count {
  color: var(--text-3);
  font-size: var(--fs-2);
  font-weight: 500;
}

/*
  Cada entrada es una tarjeta con su propio fondo y borde. Antes eran filas
  planas separadas por 4 px: con el mismo ítem repetido a distancia —que es
  justo lo que el historial conserva (SPEC 11 §3)— no se veía dónde terminaba
  una y empezaba la otra.
*/
.history__list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  min-height: var(--touch);
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
  text-align: left;
  transition:
    transform var(--dur-fast) var(--ease),
    border-color var(--dur-fast) var(--ease);
}

.row:hover {
  transform: translateX(2px);
  border-color: var(--border-strong);
  background: var(--surface-3);
}

.row__text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.row__name {
  overflow: hidden;
  color: var(--text-1);
  font-size: var(--fs-3);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row__kind {
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.row__chevron {
  flex: none;
  width: var(--sp-4);
  height: var(--sp-4);
  color: var(--text-muted);
}
</style>
