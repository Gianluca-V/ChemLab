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
 *
 * El resultado de COMBINAR se pinta acá adentro, en un <dialog> modal, con la
 * ruta hija /lab/result manejando la apertura (ver el desvío registrado abajo).
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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

/*
  > Desvío registrado respecto de SPEC 01 §2 y de los frames 09, 10 y 11, por
  > decisión del equipo. La SPEC pinta el resultado de COMBINAR como una PANTALLA
  > propia —`lab-result` era una ruta hermana de `lab`— y el usuario pidió
  > expresamente que sea un modal. La ruta quedó registrada en SPEC 01 §2.1.
  >
  > Lo que gana: combinar deja de ser un viaje de ida. La tabla y la mezcla
  > siguen ahí detrás, cerrar devuelve exactamente al estado anterior, y el
  > ciclo "combino, miro, corrijo, vuelvo a combinar" —que es el ciclo real del
  > laboratorio— no cuesta dos navegaciones por vuelta.
  >
  > Lo que cuesta: mientras el modal está abierto el resto de la página queda
  > inerte por semántica nativa de <dialog>, así que no se puede editar la
  > mezcla sin cerrar. Es el comportamiento correcto de un modal y es un toque
  > de distancia, pero es una restricción que la pantalla completa no tenía.
  >
  > Lo que NO cambia: sigue siendo una ruta. Ver el comentario en router/index.js.
*/
const route = useRoute();
const router = useRouter();

const dialog = ref(null);
const resultOpen = computed(() => route.name === 'lab-result');

/**
 * Cierra volviendo a /lab. No usa `router.back()`: si el usuario llegó pegando
 * la URL no hay historial al que volver y quedaría encerrado.
 */
function close() {
  if (resultOpen.value) router.push({ name: 'lab' });
}

/**
 * Alinea el <dialog> con la ruta, en las dos direcciones:
 *   · entrar a /lab/result   → showModal()
 *   · salir  de /lab/result   → close()   (Atrás, enlace, lo que sea)
 *
 * El evento `close` del <dialog> nativo —que disparan Escape y el botón de
 * cierre— hace el camino inverso: navega. Así no existe un estado donde la URL
 * y lo que se ve digan cosas distintas.
 */
function syncDialog() {
  const element = dialog.value;
  if (!element) return;
  if (resultOpen.value && !element.open) element.showModal();
  if (!resultOpen.value && element.open) element.close();
}

/*
  onMounted, no `watch(..., { immediate: true })`: la ejecución inmediata de un
  watcher ocurre durante el setup, cuando el ref del <dialog> todavía es null.
  Entrando por URL pegada a /lab/result el valor no vuelve a cambiar nunca, así
  que el watcher no se disparaba de nuevo y el modal no abría jamás.
*/
onMounted(syncDialog);
watch(resultOpen, syncDialog, { flush: 'post' });
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

    <!--
      El resultado. `v-slot` sobre RouterView para poder escucharle `close` al
      componente hijo: ResultView no conoce el modal ni al router, solo avisa
      que terminó.
    -->
    <dialog
      ref="dialog"
      class="result-modal"
      aria-labelledby="result-modal-title"
      @close="close"
    >
      <div class="result-modal__head">
        <h2 id="result-modal-title" class="result-modal__title">Tu mezcla</h2>
        <button
          type="button"
          class="result-modal__close"
          aria-label="Cerrar el resultado y volver a la mezcla"
          @click="close"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div class="result-modal__body">
        <RouterView v-slot="{ Component }">
          <component :is="Component" @close="close" />
        </RouterView>
      </div>
    </dialog>
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

/*
  Mismo patrón que FavoriteDialog: <dialog> nativo con showModal(). El backdrop,
  el atrapado de foco, Escape y la inertización del fondo son gratis, sin una
  sola línea de JavaScript propio.
*/
.result-modal {
  width: min(34rem, 94vw);
  /* En 390×844 un modal de alto fijo no entra (SPEC 16 §7). */
  max-height: 88vh;
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-lg);
  background: var(--surface-2);
  color: var(--text-2);
}

.result-modal::backdrop {
  background: rgba(0, 0, 0, 0.56);
}

/* El encabezado queda fijo: el cierre no se va con el scroll del contenido. */
.result-modal__head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-4) var(--sp-3);
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}

.result-modal__title {
  font-size: var(--fs-5);
}

/* Acción de ícono: piso de 44 px (SPEC 17 §3). */
.result-modal__close {
  display: grid;
  place-items: center;
  width: var(--touch);
  height: var(--touch);
  flex: none;
  border: 1px solid transparent;
  border-radius: var(--r-md);
  background: none;
  color: var(--text-2);
  font-size: var(--fs-4);
  cursor: pointer;
}

.result-modal__close:hover {
  border-color: var(--border-strong);
  color: var(--text-hi);
}

.result-modal__body {
  max-height: calc(88vh - var(--touch) - var(--sp-6));
  padding: var(--sp-4);
  overflow-y: auto;
}
</style>
