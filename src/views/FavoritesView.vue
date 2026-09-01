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
import ItemThumb from '../components/ItemThumb.vue';

import { cachedImages } from '../services/cache.js';
import { getElement } from '../services/elements.js';
import { getCompoundByFormula } from '../services/compounds.js';

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

/**
 * Flechas, Home y End dentro del tablist. Un role="tab" que solo responde al
 * click no es un tablist: el patrón ARIA exige mover la selección con el
 * teclado, con una única parada de tabulación para el grupo.
 *
 * @param {KeyboardEvent} event
 */
function onTabKeydown(event) {
  const at = TABS.findIndex((tab) => tab.key === activeTab.value);
  let next = at;

  if (event.key === 'ArrowRight') next = (at + 1) % TABS.length;
  else if (event.key === 'ArrowLeft') next = (at - 1 + TABS.length) % TABS.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = TABS.length - 1;
  else return;

  event.preventDefault();
  selectTab(TABS[next].key);
  nextTick(() => document.getElementById(`tab-${TABS[next].key}`)?.focus());
}

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

/* Índice de estructuras ya cacheadas, leído una vez al montar (ver ItemThumb). */
const images = cachedImages();

/**
 * Datos de la miniatura. Es lo ÚNICO que se cruza contra el dataset en esta
 * vista: `name` y `formula` siguen saliendo del favorito, que los copia justo
 * para poder renderizarse aunque el ítem desaparezca del dataset (SPEC 10 §2).
 * Si no hay con qué pintar la miniatura, ItemThumb cae al símbolo o a la
 * fórmula del propio favorito y la tarjeta se ve igual.
 *
 * @param {object} entry
 */
function thumbFor(entry) {
  if (entry.type === 'element') {
    return {
      symbol: entry.id,
      category: getElement(entry.id)?.category ?? '',
      formula: '',
      image: '',
    };
  }

  const key = getCompoundByFormula(entry.formula)?.key;
  return {
    symbol: '',
    category: '',
    formula: entry.formula ?? '',
    image: (key && images.get(key)) || '',
  };
}

const emptyState = ref(null);

// ── Edición ─────────────────────────────────────────────────────────────────
const editing = ref(null);
const dialogOpen = ref(false);

/** @param {object} entry */
function openEdit(entry) {
  editing.value = entry;
  dialogOpen.value = true;
}

/**
 * Guarda la edición y ofrece deshacer (SPEC 10 §9).
 *
 * Desde esta vista todo favorito ya existe, así que deshacer siempre restaura
 * la valoración y la nota previas — nunca elimina.
 *
 * @param {{rating: number, note: string}} payload
 */
function save({ rating, note }) {
  const entry = editing.value;
  const previous = { ...entry };

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
    undo: () => favorites.save(previous),
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
    <!--
      Sin <h1>: el único de la página lo pone el TopBar (SPEC 17 §9). Acá queda
      solo el conteo, en un role="status" que se anuncia al guardar o eliminar.
    -->
    <p class="favorites__count mono" role="status">
      {{ favorites.count.value }} {{ favorites.count.value === 1 ? 'guardado' : 'guardados' }}
    </p>

    <div class="favorites__tabs" role="tablist" aria-label="Tipo de favorito">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab--active': activeTab === tab.key }"
        :id="`tab-${tab.key}`"
        :aria-selected="activeTab === tab.key"
        :aria-controls="`panel-${tab.key}`"
        :tabindex="activeTab === tab.key ? 0 : -1"
        @click="selectTab(tab.key)"
        @keydown="onTabKeydown"
      >
        {{ tab.label }} ({{ itemsFor(tab.type).length }})
      </button>
    </div>

    <!--
      El panel asociado a la pestaña activa. Sin él, los role="tab" no controlan
      nada y el lector de pantalla anuncia pestañas que no llevan a ninguna
      parte. Un id por pestaña, para que aria-controls apunte al panel correcto.
    -->
    <div
      :id="`panel-${activeTab}`"
      role="tabpanel"
      :aria-labelledby="`tab-${activeTab}`"
      tabindex="0"
      class="favorites__panel"
    >
    <ul v-if="currentList.length > 0" class="favorites__list">
      <li v-for="entry in currentList" :key="`${entry.type}:${entry.id}`" class="card">
        <!--
          Todo <span>: el modelo de contenido de <button> admite contenido de
          frase, y un <p> adentro es marcado inválido.
        -->
        <button type="button" class="card__body" @click="openEdit(entry)">
          <span class="card__head">
            <ItemThumb :type="entry.type" v-bind="thumbFor(entry)" />

            <span class="card__title">
              <ChemFormula v-if="entry.type === 'compound'" :formula="entry.formula" />
              {{ entry.name }}
            </span>
          </span>

          <span class="card__rating">
            <span aria-hidden="true">{{ '★'.repeat(entry.rating) }}{{ '☆'.repeat(5 - entry.rating) }}</span>
            <span class="mono">{{ entry.rating }} / 5</span>
          </span>

          <!--
            La nota se dibuja SIEMPRE, con o sin texto. Compactar la tarjeta sin
            nota le daba a cada favorito un área de hover de alto distinto, y el
            hover dejaba de leerse como un patrón: parecía que unas tarjetas
            respondían de una forma y otras de otra.
          -->
          <span class="card__note" :class="{ 'card__note--empty': !entry.note }">
            {{ entry.note || 'Sin nota' }}
          </span>
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
          <!--
            Papelera de trazo, no el emoji 🗑: el emoji se pinta distinto en
            cada sistema —en algunos es un tacho con tapa, en otros una hoja
            arrugada—, no hereda el color del tema y no reacciona al hover.
          -->
          <button
            type="button"
            class="card__delete"
            :aria-label="`Eliminar ${entry.name} de favoritos`"
            @click="requestDelete(entry)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M4 7h16M10 4h4M9 7v12M15 7v12M6 7l1 13h10l1-13"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
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
    </div>

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

.favorites__count {
  color: var(--text-3);
  font-size: var(--fs-2);
}

/* El outline del foco lo da la regla global :focus-visible de base.css. */
.favorites__panel {
  display: block;
  border-radius: var(--r-md);
}

.favorites__tabs {
  display: flex;
  gap: var(--sp-2);
}

.tab {
  min-height: var(--touch-inline);
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease);
  padding: 0 var(--sp-3);
  border-radius: var(--r-full);
  background: var(--chip-bg);
  color: var(--text-2);
  font-size: var(--fs-2);
}

/*
  Hover distinto del estado activo: la pestaña activa ya se distingue por fondo
  y peso, así que el hover mueve el color del texto y el borde del fondo para
  que se lea "esto responde" sin competir con "esto está seleccionado".
*/
.tab:hover {
  background: var(--surface-4);
  color: var(--text-1);
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
  transition: border-color var(--dur) var(--ease);
}

/* La tarjeta entera acusa el hover; el cuerpo, que es el que abre la edición,
   además se pinta. Antes era el único control de la vista que no respondía. */
.card:hover {
  border-color: var(--border-strong);
}

.card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--sp-1);
  min-width: 0;
  padding: var(--sp-1);
  margin: calc(var(--sp-1) * -1);
  border-radius: var(--r-md);
  text-align: left;
  transition: background-color var(--dur) var(--ease);
}

.card__body:hover {
  background: var(--surface-3);
}

.card__head {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--sp-3);
}

.card__title {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
  color: var(--text-1);
  font-size: var(--fs-4);
  font-weight: 600;
}

.card__rating {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--sp-2);
  color: var(--star-on);
  font-size: var(--fs-3);
}

.card__rating .mono {
  color: var(--text-3);
  font-size: var(--fs-2);
}

.card__note--empty {
  color: var(--text-muted);
}

.card__note {
  width: 100%;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  color: var(--text-3);
  font-size: var(--fs-2);
}

/* Va después de .card__note: misma especificidad, gana la última. */
.card__note--empty {
  color: var(--text-muted);
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

.card__delete svg {
  width: var(--sp-5);
  height: var(--sp-5);
}

.card__delete:hover {
  background: var(--surface-3);
  color: var(--hazard-text);
}
</style>
