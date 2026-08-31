<script setup>
/**
 * Encabezado — frame 02; en el detalle, frames 06 y 10
 *
 * Vive en App.vue, fuera del RouterView: se monta una sola vez y persiste en
 * todas las rutas, cumpliendo RF1 —navegación disponible desde cualquier punto—.
 *
 * Desaparece a partir de 1024 px, donde la navegación pasa a NavSidebar.
 */
import { useRouter } from 'vue-router';

defineProps({
  title: { type: String, required: true },
  /** Muestra el botón de volver. Solo en las vistas de detalle. */
  back: { type: Boolean, default: false },
  /** Ruta a la que caer si no hay historial de navegación interno. */
  backFallback: { type: String, default: 'table' },
});

const emit = defineEmits(['open-nav']);

const router = useRouter();

/**
 * Vuelve al listado correspondiente. Usa router.back() cuando hay historial de
 * navegación dentro de la aplicación; ante una entrada directa por URL pegada
 * —donde no hay a dónde volver— navega a la ruta de respaldo.
 *
 * @param {string} fallback
 */
function goBack(fallback) {
  if (window.history.state?.back) {
    router.back();
  } else {
    router.push({ name: fallback });
  }
}
</script>

<template>
  <header class="topbar">
    <button
      v-if="back"
      type="button"
      class="topbar__icon"
      aria-label="Volver"
      @click="goBack(backFallback)"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M15 5 8 12l7 7"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <!--
      Único <h1> de la página. Vive acá y no en la vista porque el TopBar ya es
      donde los frames ponen el título, y repetirlo abajo lo mostraba dos veces
      en pantalla. Las vistas arrancan su jerarquía en <h2> (SPEC 17 §9).
    -->
    <h1 class="topbar__title">{{ title }}</h1>

    <!-- Acciones de la vista: la estrella de favorito en los detalles. -->
    <slot name="actions" />

    <button
      type="button"
      class="topbar__icon topbar__icon--nav"
      aria-label="Abrir el menú de navegación"
      aria-haspopup="dialog"
      @click="emit('open-nav')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M4 7h16M4 12h16M4 17h16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border-bottom: 1px solid var(--border);
  background: var(--surface-1);
}

.topbar__title {
  flex: 1;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  color: var(--text-1);
  font-size: var(--fs-5);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar__icon {
  flex: none;
  display: grid;
  place-items: center;
  width: var(--touch);
  height: var(--touch);
  border-radius: var(--r-md);
  color: var(--text-2);
}

.topbar__icon:hover {
  background: var(--surface-3);
  color: var(--text-1);
}

.topbar__icon svg {
  width: var(--sp-5);
  height: var(--sp-5);
}

/*
  Desde 1024 px la navegación es la sidebar fija y la hamburguesa sobra. La
  barra se queda: el botón de volver y la estrella de favorito de las vistas de
  detalle viven acá y tienen que seguir alcanzables (SPEC 06 §2, §4).
*/
@media (min-width: 1024px) {
  .topbar {
    position: static;
    border-bottom: none;
    padding-inline: 0;
  }

  .topbar__icon--nav {
    display: none;
  }
}
</style>
