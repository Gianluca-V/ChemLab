<script setup>
/**
 * Favoritos — frames 12–15, 20, 23, 24; SPEC 10
 *
 * El composable useFavorites() ya persiste todo (SPEC 00 §4); esta vista es
 * pura presentación: pestañas por tipo, tarjeta que abre FavoriteDialog en
 * modo edición, eliminación con ConfirmSheet y toast de confirmación.
 *
 * El diálogo se reimporta directo acá, no vía FavoriteStar: FavoriteStar está
 * atado a un único id/type fijo (el ítem de la vista de detalle), mientras que
 * acá cualquier tarjeta de la lista puede abrirlo.
 */
import { computed, nextTick, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ChemFormula from '../components/ChemFormula.vue';
import ConfirmSheet from '../components/ConfirmSheet.vue';
import EmptyState from '../components/EmptyState.vue';
import FavoriteDialog from '../components/FavoriteDialog.vue';

import { useFavorites } from '../composables/useFavorites.js';
import { useToast } from '../composables/useToast.js';

const route = useRoute();
const router = useRouter();
const favorites = useFavorites();
const toast = useToast();

const TABS = [
  { key: 'compounds', type: 'compound', label: 'Compuestos' },
  { key: 'elements', type: 'element', label: 'Elementos' },
];

const activeTab = computed(() => (route.query.tab === 'elements' ? 'elements' : 'compounds'));

/** @param {string} key */
function selectTab(key) {
  router.push({ name: 'favorites', query: key === 'compounds' ? {} : { tab: key } });
}

function itemsFor(type) {
  return favorites.items.value
    .filter((entry) => entry.type === type)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

const currentList = computed(() => itemsFor(TABS.find((t) => t.key === activeTab.value).type));

const emptyState = ref(null);

// ── Edición ─────────────────────────────────────────────────────────────────
const editing = ref(null);
const dialogOpen = ref(false);

/** @param {object} entry */
function openEdit(entry) {
  editing.value = entry;
  dialogOpen.value = true;
}

/** @param {{rating: number, note: string}} payload */
function save({ rating, note }) {
  const entry = editing.value;
  favorites.save({
    id: entry.id,
    type: entry.type,
    name: entry.name,
    formula: entry.formula,
    rating,
    note,
  });
  dialogOpen.value = false;

  toast.show({
    type: 'favorite-save',
    title: 'Guardado en favoritos',
    detail: `${entry.name} · ${rating} de 5 estrellas`,
  });
}

// ── Eliminación ─────────────────────────────────────────────────────────────
const deleting = ref(null);

/** @param {object} entry */
function requestDelete(entry) {
  dialogOpen.value = false;
  deleting.value = entry;
}

async function confirmDelete() {
  const entry = deleting.value;
  favorites.remove(entry.id, entry.type);
  deleting.value = null;

  toast.show({ type: 'favorite-delete', title: 'Favorito eliminado', detail: entry.name });

  if (currentList.value.length === 0) {
    await nextTick();
    emptyState.value?.focus();
  }
}
</script>

<template>
  <div class="favorites">
    <div class="favorites__head">
      <h1>Favoritos</h1>
      <p class="mono" role="status">{{ favorites.count.value }} guardados</p>
    </div>

    <div class="favorites__tabs" role="tablist" aria-label="Tipo de favorito">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab--active': activeTab === tab.key }"
        :aria-selected="activeTab === tab.key"
        @click="selectTab(tab.key)"
      >
        {{ tab.label }} ({{ itemsFor(tab.type).length }})
      </button>
    </div>

    <ul v-if="currentList.length > 0" class="favorites__list">
      <li v-for="entry in currentList" :key="`${entry.type}:${entry.id}`" class="card">
        <button type="button" class="card__body" @click="openEdit(entry)">
          <p class="card__title">
            <ChemFormula v-if="entry.type === 'compound'" :formula="entry.formula" />
            {{ entry.name }}
          </p>

          <p class="card__rating">
            <span aria-hidden="true">{{ '★'.repeat(entry.rating) }}{{ '☆'.repeat(5 - entry.rating) }}</span>
            <span class="mono">{{ entry.rating }} / 5</span>
          </p>

          <p v-if="entry.note" class="card__note">{{ entry.note }}</p>
        </button>

        <div class="card__actions">
          <RouterLink
            class="btn btn--inline btn--ghost"
            :to="
              entry.type === 'element'
                ? { name: 'element', params: { symbol: entry.id } }
                : { name: 'compound', params: { formula: entry.formula } }
            "
          >
            Ver detalle
          </RouterLink>
          <button
            type="button"
            class="card__delete"
            :aria-label="`Eliminar ${entry.name} de favoritos`"
            @click="requestDelete(entry)"
          >
            <span aria-hidden="true">🗑</span>
          </button>
        </div>
      </li>
    </ul>

    <EmptyState
      v-else
      ref="emptyState"
      icon="★"
      title="Todavía no guardaste favoritos"
      description="Tocá la estrella en cualquier elemento o compuesto y quedará acá, con tu valoración y tu nota."
      :ghosts="2"
      focusable
    />

    <!--
      Montados siempre, como FavoriteStar.vue: el watch interno de open (sin
      immediate) de FavoriteDialog/ConfirmSheet solo reacciona a un CAMBIO. Si
      el diálogo se montara con v-if justo cuando open ya es true, ese primer
      valor no dispara el watch y showModal() nunca se llama.
    -->
    <FavoriteDialog
      :open="dialogOpen"
      :item-name="editing?.name ?? ''"
      :existing="editing"
      @save="save"
      @delete="editing && requestDelete(editing)"
      @close="dialogOpen = false"
    />

    <ConfirmSheet
      :open="deleting !== null"
      :title="deleting ? `¿Eliminar «${deleting.name}» de favoritos?` : ''"
      body="Se borran la valoración y la nota que escribiste. La acción no se puede deshacer: los favoritos viven solo en este navegador."
      @confirm="confirmDelete"
      @close="deleting = null"
    />
  </div>
</template>

<style scoped>
.favorites {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.favorites__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-2);
}

.favorites__head p {
  color: var(--text-3);
  font-size: var(--fs-2);
}

.favorites__tabs {
  display: flex;
  gap: var(--sp-2);
}

.tab {
  min-height: var(--touch-inline);
  padding: 0 var(--sp-3);
  border-radius: var(--r-full);
  background: var(--chip-bg);
  color: var(--text-2);
  font-size: var(--fs-2);
}

.tab--active {
  background: var(--surface-4);
  color: var(--text-1);
  font-weight: 600;
}

.favorites__list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.card {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
}

.card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--sp-1);
  min-width: 0;
  text-align: left;
}

.card__title {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  color: var(--text-1);
  font-size: var(--fs-4);
  font-weight: 600;
}

.card__rating {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  color: var(--star-on);
  font-size: var(--fs-3);
}

.card__rating .mono {
  color: var(--text-3);
  font-size: var(--fs-2);
}

.card__note {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  color: var(--text-3);
  font-size: var(--fs-2);
}

.card__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--sp-2);
}

.card__delete {
  display: grid;
  place-items: center;
  width: var(--touch);
  height: var(--touch);
  border-radius: var(--r-md);
  color: var(--text-3);
}

.card__delete:hover {
  background: var(--surface-3);
  color: var(--hazard-text);
}
</style>
