<script setup>
/**
 * Navegación colapsable — frame 02, SPEC 01 §6, SPEC 16 §5
 *
 * <dialog> nativo con showModal(): backdrop, atrapado de foco, Escape e
 * inertización del fondo salen gratis, sin una línea de JavaScript propio.
 *
 * Se cierra automáticamente después de cada navegación exitosa y devuelve el
 * foco a la hamburguesa que lo abrió (SPEC 15 §8, SPEC 17 §5).
 *
 * Los badges se leen de useDiscoveries() y useFavorites(), que son reactivos:
 * se actualizan solos sin que la vista activa intervenga.
 */
import { onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { NAV_ITEMS } from '../router/index.js';
import { useDiscoveries } from '../composables/useDiscoveries.js';
import { useFavorites } from '../composables/useFavorites.js';
import ThemeToggle from './ThemeToggle.vue';

const props = defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(['close']);

const dialog = ref(null);
const router = useRouter();
const discoveries = useDiscoveries();
const favorites = useFavorites();

watch(
  () => props.open,
  (isOpen) => {
    const element = dialog.value;
    if (!element) return;
    if (isOpen && !element.open) element.showModal();
    if (!isOpen && element.open) element.close();
  }
);

// Cierre tras navegar. Vale para cualquier origen: enlace, back o URL pegada.
const stopAfterEach = router.afterEach(() => emit('close'));
onBeforeUnmount(stopAfterEach);

/**
 * @param {{badge?: string}} item
 * @returns {string|null}
 */
function badgeOf(item) {
  if (item.badge === 'discoveries') {
    return `${discoveries.count.value}/${discoveries.total.value}`;
  }
  if (item.badge === 'favorites') {
    return favorites.count.value > 0 ? String(favorites.count.value) : null;
  }
  return null;
}
</script>

<template>
  <dialog ref="dialog" class="drawer" aria-label="Navegación principal" @close="emit('close')">
    <nav class="drawer__panel">
      <div class="drawer__head">
        <p class="drawer__brand">ChemLab</p>
        <button
          type="button"
          class="drawer__close"
          aria-label="Cerrar el menú de navegación"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="m6 6 12 12M18 6 6 18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <ul>
        <li v-for="item in NAV_ITEMS" :key="item.name">
          <RouterLink :to="{ name: item.name }" class="drawer__link">
            <span>{{ item.label }}</span>
            <span v-if="badgeOf(item)" class="drawer__badge">{{ badgeOf(item) }}</span>
          </RouterLink>
        </li>
      </ul>

      <!-- "Tema" no es un enlace: no navega, invoca useTheme(). -->
      <div class="drawer__theme">
        <ThemeToggle class="theme-toggle--labelled" />
      </div>
    </nav>
  </dialog>
</template>

<style scoped>
.drawer {
  width: min(20rem, 84vw);
  max-width: none;
  max-height: 100dvh;
  height: 100dvh;
  margin: 0 0 0 auto;
  padding: 0;
  border: none;
  border-left: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-2);
}

.drawer::backdrop {
  background: rgba(0, 0, 0, 0.56);
}

.drawer__panel {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  height: 100%;
  padding: var(--sp-3);
  overflow-y: auto;
}

.drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.drawer__brand {
  color: var(--text-1);
  font-size: var(--fs-5);
  font-weight: 700;
}

.drawer__close {
  display: grid;
  place-items: center;
  width: var(--touch);
  height: var(--touch);
  border-radius: var(--r-md);
  color: var(--text-3);
}

.drawer__close svg {
  width: var(--sp-4);
  height: var(--sp-4);
}

.drawer__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  min-height: var(--touch);
  padding: 0 var(--sp-3);
  border-radius: var(--r-md);
  color: var(--text-2);
  font-size: var(--fs-3);
  text-decoration: none;
}

.drawer__link:hover {
  background: var(--surface-3);
  color: var(--text-1);
  text-decoration: none;
}

.drawer__link.router-link-active {
  background: var(--surface-4);
  color: var(--text-1);
  font-weight: 600;
}

.drawer__badge {
  padding: 0 var(--sp-2);
  border-radius: var(--r-full);
  background: var(--chip-bg);
  color: var(--text-3);
  font-family: var(--font-mono);
  font-size: var(--fs-1);
  line-height: 1.7;
}

.drawer__theme {
  margin-top: auto;
  padding-top: var(--sp-3);
  border-top: 1px solid var(--border);
}

@media (min-width: 1024px) {
  .drawer {
    display: none;
  }
}
</style>
