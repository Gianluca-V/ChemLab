<script setup>
/**
 * Navegación fija de escritorio — frame 28, SPEC 16 §5
 *
 * Columna de 240 px, siempre visible, sin hamburguesa. Solo a partir de
 * 1024 px: a 834 px, restar 240 px de sidebar a una tabla que ya necesita
 * scroll horizontal empeora el problema, así que tablet conserva el drawer.
 *
 * Consume la MISMA lista de entradas y los mismos badges que NavDrawer.
 */
import { NAV_ITEMS } from '../router/index.js';
import { useDiscoveries } from '../composables/useDiscoveries.js';
import { useFavorites } from '../composables/useFavorites.js';
import ThemeToggle from './ThemeToggle.vue';

const discoveries = useDiscoveries();
const favorites = useFavorites();

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
  <nav class="sidebar" aria-label="Navegación principal">
    <RouterLink :to="{ name: 'home' }" class="sidebar__brand">ChemLab</RouterLink>

    <ul>
      <li v-for="item in NAV_ITEMS" :key="item.name">
        <RouterLink :to="{ name: item.name }" class="sidebar__link">
          <span>{{ item.label }}</span>
          <span v-if="badgeOf(item)" class="sidebar__badge">{{ badgeOf(item) }}</span>
        </RouterLink>
      </li>
    </ul>

    <div class="sidebar__theme">
      <ThemeToggle class="theme-toggle--labelled" />
    </div>
  </nav>
</template>

<style scoped>
/* Base mobile: no existe. Desde 1024 px reemplaza al TopBar + NavDrawer. */
.sidebar {
  display: none;
}

@media (min-width: 1024px) {
  .sidebar {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    height: 100dvh;
    padding: var(--sp-4) var(--sp-3);
    border-right: 1px solid var(--border);
  }

  .sidebar__brand {
    display: block;
    padding: 0 var(--sp-3) var(--sp-4);
    color: var(--text-1);
    font-size: var(--fs-6);
    font-weight: 700;
    text-decoration: none;
  }

  .sidebar__link {
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

  .sidebar__link:hover {
    background: var(--surface-3);
    color: var(--text-1);
    text-decoration: none;
  }

  .sidebar__link.router-link-active {
    background: var(--surface-4);
    color: var(--text-1);
    font-weight: 600;
  }

  .sidebar__badge {
    padding: 0 var(--sp-2);
    border-radius: var(--r-full);
    background: var(--chip-bg);
    color: var(--text-3);
    font-family: var(--font-mono);
    font-size: var(--fs-1);
    line-height: 1.7;
  }

  .sidebar__theme {
    margin-top: auto;
    padding-top: var(--sp-3);
    border-top: 1px solid var(--border);
  }
}
</style>
