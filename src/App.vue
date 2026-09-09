<script setup>
/**
 * Shell de la aplicación — SPEC 01 §6, SPEC 16 §3
 *
 * El encabezado, el drawer y la sidebar viven acá, FUERA del RouterView: se
 * montan una sola vez y persisten en todas las rutas, cumpliendo RF1
 * —navegación disponible desde cualquier punto—.
 *
 * El TopBar de las vistas de detalle —‹ título ☆ ≡— se resuelve también acá.
 * Es posible sin acoplar nada porque los dos datasets están en memoria antes de
 * montar (main.js): resolver /element/:symbol o /compound/:formula es un lookup
 * síncrono en un Map, así que el shell puede leer el nombre y la identidad del
 * favorito directamente de la ruta.
 *
 * La aparición del panel lateral es PURAMENTE CSS. No hay guard de router que
 * mire el ancho, no hay window.innerWidth en JavaScript, ningún componente
 * escucha resize. Redimensionar la ventana no puede dejar al usuario en un
 * estado inconsistente.
 */
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import TopBar from './components/TopBar.vue';
import NavDrawer from './components/NavDrawer.vue';
import NavSidebar from './components/NavSidebar.vue';
import MixturePanel from './components/MixturePanel.vue';
import FavoriteStar from './components/FavoriteStar.vue';
import ToastHost from './components/ToastHost.vue';
import UpdatePrompt from './components/UpdatePrompt.vue';

import { getElement } from './services/elements.js';
import { getCompoundByFormula } from './services/compounds.js';

const route = useRoute();
const navOpen = ref(false);

/** Identidad del ítem cuando la ruta activa es una vista de detalle. */
const detail = computed(() => {
  if (route.name === 'element') {
    const element = getElement(String(route.params.symbol));
    return element ? { id: element.symbol, type: 'element', name: element.name, formula: null } : null;
  }
  if (route.name === 'compound') {
    const compound = getCompoundByFormula(String(route.params.formula));
    return compound
      ? { id: compound.formula, type: 'compound', name: compound.name, formula: compound.formula }
      : null;
  }
  return null;
});

const isDetailRoute = computed(() => route.name === 'element' || route.name === 'compound');

/**
 * El panel del laboratorio se muestra salvo que la ruta lo apague con
 * `meta.panel: false` — Favoritos, Historial y Contacto.
 *
 * La condición es la RUTA, no el ancho de la ventana: sigue sin haber lógica
 * de breakpoint en JavaScript. El default es mostrarlo, así que una ruta nueva
 * lo hereda sin tener que acordarse de pedirlo.
 */
const showPanel = computed(() => route.meta?.panel !== false);

/*
  `shellTitle` gana sobre `title` cuando la ruta activa se pinta como modal
  sobre otra: en /lab/result el encabezado sigue diciendo "Laboratorio" porque
  lo que hay detrás del modal ES el laboratorio. El modal lleva su propio
  título y document.title sí dice "Resultado".
*/
const title = computed(
  () => detail.value?.name ?? route.meta?.shellTitle ?? route.meta?.title ?? 'ChemLab'
);
</script>

<template>
  <a class="skip-link" href="#main">Saltar al contenido</a>

  <div class="layout">
    <NavSidebar />

    <div class="layout__content">
      <TopBar
        :title="title"
        :back="isDetailRoute"
        back-fallback="lab"
        @open-nav="navOpen = true"
      >
        <template #actions>
          <FavoriteStar
            v-if="detail"
            :id="detail.id"
            :type="detail.type"
            :name="detail.name"
            :formula="detail.formula"
          />
        </template>
      </TopBar>

      <div class="shell" :class="{ 'shell--solo': !showPanel }">
        <main id="main" class="shell__main" tabindex="-1">
          <RouterView />
        </main>

        <!--
          Panel de mezcla, presente en las rutas donde armar una mezcla tiene
          sentido. Va DEBAJO del contenido hasta 1023 px y al costado desde ahí:
          a 768–1023 px el panel lateral le robaba 320 px a una tabla que ya
          necesitaba scroll horizontal, y apilarlo le devuelve el ancho completo
          a la grilla.

          En Favoritos, Historial y Contacto no se monta (meta.panel: false) y
          `shell--solo` colapsa la columna que ocupaba, para que el contenido se
          quede con el ancho entero en vez de dejar 360 px vacíos al costado.
        -->
        <aside
          v-if="showPanel"
          id="mixture"
          class="shell__panel"
          aria-label="Panel del laboratorio"
        >
          <MixturePanel variant="aside" />
        </aside>
      </div>
    </div>
  </div>

  <NavDrawer :open="navOpen" @close="navOpen = false" />
  <ToastHost />
  <UpdatePrompt />
</template>

<style scoped>
.layout {
  min-height: 100dvh;
}

.layout__content {
  min-width: 0;
}

/*
  El ToastHost es fixed al pie. Sin este colchón, con la página scrolleada al
  fondo la última acción de la vista queda DEBAJO del toast durante 4 segundos,
  y el flujo de tocar "Añadir otro" varias veces seguidas —que SPEC 06 §2 da por
  supuesto— se bloquea. El valor reservado sale de --toast-clearance.
*/
.shell {
  display: block;
  padding: var(--sp-3);
  padding-bottom: var(--toast-clearance);
}

.shell__main:focus-visible {
  outline: none;
}

/*
  El panel se apila debajo del contenido, en una sola columna, hasta 1023 px.
  Es visible en todas las rutas: no hace falta navegar a ningún lado para ver
  la mezcla.
*/
.shell__panel {
  display: block;
  margin-top: var(--sp-4);
}

@media (min-width: 768px) {
  .shell {
    padding: var(--sp-4);
    padding-bottom: var(--toast-clearance);
  }
}

/* Desktop: la sidebar fija reemplaza a la hamburguesa y el panel va al costado. */
@media (min-width: 1024px) {
  .layout {
    display: grid;
    grid-template-columns: var(--sidebar-w) minmax(0, 1fr);
    align-items: start;
  }

  .shell {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--panel-w-lg);
    align-items: start;
    gap: var(--sp-4);
    padding: var(--sp-5);
    padding-bottom: var(--toast-clearance);
  }

  /* Sin panel no hay segunda columna que reservar. */
  .shell--solo {
    grid-template-columns: minmax(0, 1fr);
  }

  .shell__panel {
    position: sticky;
    top: var(--sp-5);
    margin-top: 0;
  }
}
</style>
