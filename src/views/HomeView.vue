<script setup>
/**
 * Home — frame 01, 25; RF1; SPEC 13 §A
 *
 * Punto de entrada. InstallPrompt queda fuera (SPEC 18, PWA). El resto de
 * §A —descripción, dos accesos, progreso clickeable— sí se implementa acá.
 */
import { useDiscoveries } from '../composables/useDiscoveries.js';
import ProgressBar from '../components/ProgressBar.vue';

const discoveries = useDiscoveries();
</script>

<template>
  <div class="home">
    <header class="home__hero">
      <p class="home__lead">
        Explorá los 118 elementos, combinálos y descubrí qué compuestos hay registrados en la
        base de datos de ChemLab.
      </p>
      <p class="home__sub">
        Datos locales de la tabla periódica e información de compuestos de PubChem.
      </p>
    </header>

    <nav class="home__actions" aria-label="Accesos principales">
      <RouterLink :to="{ name: 'lab' }" class="btn btn--primary">Ir al laboratorio</RouterLink>
      <RouterLink :to="{ name: 'search' }" class="btn btn--ghost">Buscar elementos</RouterLink>
    </nav>

    <RouterLink :to="{ name: 'discoveries' }" class="home__progress">
      <h2 class="home__section">Tu progreso</h2>
      <ProgressBar
        :value="discoveries.count.value"
        :max="discoveries.total.value"
        label="Compuestos descubiertos"
      />
    </RouterLink>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
  max-width: 44rem;
}

.home__lead {
  color: var(--text-2);
  font-size: var(--fs-4);
}

.home__sub {
  margin-top: var(--sp-2);
  color: var(--text-3);
  font-size: var(--fs-3);
}

.home__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.home__section {
  margin-bottom: var(--sp-3);
  font-size: var(--fs-4);
}

.home__progress {
  display: block;
  padding: var(--sp-4);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
  transition: transform var(--dur-fast) var(--ease);
}

.home__progress:hover {
  transform: translateY(-1px);
  text-decoration: none;
}
</style>
