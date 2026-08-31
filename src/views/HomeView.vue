<script setup>
/**
 * Home — frame 01, RF1
 *
 * Punto de entrada. La especificación completa de esta vista —hero, bloques de
 * acceso, InstallPrompt— está en SPEC 13 §A, fuera del alcance de esta entrega.
 * Acá se implementa lo que RF1 y SPEC 01 §6 exigen para que la aplicación tenga
 * un ingreso coherente: identidad, las tres entradas principales y el progreso.
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
    </header>

    <nav class="home__actions" aria-label="Accesos principales">
      <RouterLink :to="{ name: 'lab' }" class="btn btn--primary">Tabla periódica</RouterLink>
      <RouterLink :to="{ name: 'lab' }" class="btn">Laboratorio</RouterLink>
      <RouterLink :to="{ name: 'search' }" class="btn btn--ghost">Búsqueda</RouterLink>
    </nav>

    <section class="home__progress" aria-labelledby="home-progress-heading">
      <h2 id="home-progress-heading" class="home__section">Tu progreso</h2>
      <ProgressBar
        :value="discoveries.count.value"
        :max="discoveries.total.value"
        label="Compuestos descubiertos"
      />
    </section>
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
  padding: var(--sp-4);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
}
</style>
