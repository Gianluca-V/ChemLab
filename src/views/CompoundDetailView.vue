<script setup>
/**
 * Detalle de compuesto — frame 10, SPEC 06 §3
 *
 * Envoltorio delgado sobre CompoundInfo, que es el componente compartido con
 * ResultView. Acá el marco es el de una vista de detalle: la estrella y el
 * botón de volver viven en el TopBar, y la visita registra historial por el
 * afterEach del router.
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import CompoundInfo from '../components/CompoundInfo.vue';
import EmptyState from '../components/EmptyState.vue';
import { getCompoundByFormula } from '../services/compounds.js';

const route = useRoute();

/**
 * Identidad unificada, con la misma forma que produce identifyMixture: esta
 * ruta solo alcanza compuestos del dataset, así que `inDataset` es siempre
 * true y la descripción interna siempre está.
 */
const compound = computed(() => {
  const entry = getCompoundByFormula(String(route.params.formula));
  return entry ? { ...entry, inDataset: true } : null;
});
</script>

<template>
  <div class="view">
    <CompoundInfo v-if="compound" :compound="compound" />

    <!--
      Fórmula que no está en compounds.json: se muestra el estado "sin compuesto
      registrado" dentro de la vista. NO se redirige a not-found — la ruta es
      válida, el recurso no existe (SPEC 01 §3).
    -->
    <EmptyState
      v-else
      icon="⚗"
      title="Sin compuesto registrado"
      :description="`No encontramos un compuesto compatible en la base de datos de ChemLab para «${route.params.formula}».`"
    >
      <template #action>
        <RouterLink :to="{ name: 'lab' }" class="btn btn--primary">Ir al laboratorio</RouterLink>
      </template>
    </EmptyState>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}
</style>
