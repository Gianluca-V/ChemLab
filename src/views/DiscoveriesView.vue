<script setup>
/**
 * Descubrimientos — frame 17; SPEC 12
 *
 * Descubiertos primero, en orden de descubrimiento; bloqueados después, en
 * orden del dataset (SPEC 12 §4). La pista de una tarjeta bloqueada cuenta
 * átomos totales, no tipos de elemento — el mismo vocabulario que el
 * laboratorio (SPEC 12 §4, CORRECCIONES §1).
 */
import { computed } from 'vue';

import DiscoveryCard from '../components/DiscoveryCard.vue';
import ProgressBar from '../components/ProgressBar.vue';

import { allCompounds, getCompoundByKey } from '../services/compounds.js';
import { useDiscoveries } from '../composables/useDiscoveries.js';

const discoveries = useDiscoveries();

const discovered = computed(() =>
  discoveries.keys.value.map(getCompoundByKey).filter(Boolean)
);

const locked = computed(() =>
  allCompounds().filter((compound) => !discoveries.has(compound.key))
);

/** @param {object} compound */
function atomHint(compound) {
  return Object.values(compound.elements).reduce((a, b) => a + b, 0);
}

const progressText = computed(() => {
  const remaining = discoveries.total.value - discoveries.count.value;
  return remaining === 0
    ? `Descubriste los ${discoveries.total.value} compuestos. Completaste el laboratorio.`
    : `Te faltan ${remaining} para completar el laboratorio.`;
});
</script>

<template>
  <div class="discoveries">
    <h1>Descubrimientos</h1>

    <section class="discoveries__progress" aria-labelledby="progress-heading">
      <h2 id="progress-heading" class="visually-hidden">Progreso</h2>
      <ProgressBar
        :value="discoveries.count.value"
        :max="discoveries.total.value"
        label="Compuestos descubiertos"
      />
      <p class="discoveries__hint">{{ progressText }}</p>
    </section>

    <div v-if="discoveries.count.value === 0" class="discoveries__cta">
      <p>Todavía no descubriste ningún compuesto.</p>
      <p>Armá una mezcla en el laboratorio y tocá COMBINAR.</p>
      <RouterLink :to="{ name: 'lab' }" class="btn btn--primary">Ir al laboratorio</RouterLink>
    </div>

    <ul class="discoveries__grid">
      <li v-for="compound in discovered" :key="compound.key">
        <DiscoveryCard :compound="compound" />
      </li>
      <li v-for="compound in locked" :key="compound.key">
        <DiscoveryCard :hint="atomHint(compound)" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.discoveries {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.discoveries__progress {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-4);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
}

.discoveries__hint {
  color: var(--text-3);
  font-size: var(--fs-2);
}

.discoveries__cta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--sp-2);
  padding: var(--sp-4);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  color: var(--text-2);
}

.discoveries__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-2);
}

@media (min-width: 768px) {
  .discoveries__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .discoveries__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
