<script setup>
/**
 * Resultado de la combinación — frames 09, 10, 11, 22, 26; SPEC 08, SPEC 09
 *
 * NO es una vista de detalle: es el resultado de una acción. Por eso el
 * favorito va al pie, junto a su acción hermana "Volver a la mezcla", y por eso
 * NO registra historial. El frame 10 dibuja ese par y se respeta.
 *
 * El motor identifica el compuesto contra el dataset LOCAL y devuelve. PubChem
 * se consulta después, solo si hay compuesto identificado, y no puede afectar
 * al match: si no responde, el compuesto sigue identificado y el descubrimiento
 * igual se registra.
 *
 * Desde 768 px el área principal muestra la tabla: el <aside> del shell ya
 * lleva el bloque de resultado, como en el frame 28 (SPEC 16 §4).
 */
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import ChemFormula from '../components/ChemFormula.vue';
import CompoundInfo from '../components/CompoundInfo.vue';
import EmptyState from '../components/EmptyState.vue';
import FavoriteStar from '../components/FavoriteStar.vue';
import PeriodicTable from '../components/PeriodicTable.vue';

import { allElements } from '../services/elements.js';
import { allCompounds, matchMixture } from '../services/compounds.js';
import { subscriptFormula, suggest } from '../services/chemistry.js';
import { useDiscoveries } from '../composables/useDiscoveries.js';
import { useMixture } from '../composables/useMixture.js';

const router = useRouter();
const mixture = useMixture();
const discoveries = useDiscoveries();

// Entrar acá —por COMBINAR o por recarga con la URL pegada— es haber combinado.
mixture.markCombined();

const result = computed(() =>
  mixture.isEmpty.value ? null : matchMixture(mixture.items.value)
);

/**
 * El descubrimiento se registra UNA sola vez, la primera. El motor no lo
 * registra: devuelve el resultado y esta vista decide qué hacer con él
 * (SPEC 08 §8).
 *
 * `status: 'multiple'` es idéntico a `'exact'` a estos efectos: el
 * multiplicador no cambia qué compuesto se identificó.
 */
const isNewDiscovery = ref(false);
if (result.value?.compound) {
  isNewDiscovery.value = discoveries.record(result.value.compound.key);
}

/** Hasta 4 sugerencias, solo entre los no descubiertos (SPEC 08 §7). */
const suggestions = computed(() => {
  if (!result.value || result.value.compound) return [];
  return suggest({
    mixture: mixture.items.value,
    compounds: allCompounds(),
    discoveredKeys: discoveries.keySet.value,
  });
});

const elements = allElements();

/** @param {string} symbol */
function openElement(symbol) {
  router.push({ name: 'element', params: { symbol } });
}
</script>

<template>
  <div class="result">
    <div class="result__main">
      <!-- Mezcla vacía: no hay nada que combinar. -->
      <EmptyState
        v-if="!result"
        icon="⚗"
        title="Tu mezcla está vacía"
        description="Seleccioná elementos de la tabla periódica para comenzar."
      >
        <template #action>
          <RouterLink :to="{ name: 'table' }" class="btn btn--primary">
            Abrir tabla periódica
          </RouterLink>
        </template>
      </EmptyState>

      <template v-else-if="result.compound">
        <!-- Banner del frame 10: solo la primera vez que se descubre. -->
        <p v-if="isNewDiscovery" class="result__banner" role="status">
          🎉 ¡Nuevo compuesto descubierto! · {{ discoveries.count.value }} de
          {{ discoveries.total.value }} registrados
        </p>

        <!--
          El multiplicador es información, no ruido: el usuario armó H4O2 y el
          sistema le muestra que la fórmula empírica es H2O. Se enuncia como
          equivalencia de COMPOSICIÓN, nunca como cantidad de moléculas
          producidas.
        -->
        <p v-if="result.multiplier > 1" class="result__multiplier">
          Tu mezcla equivale a {{ result.multiplier }} unidades de
          {{ subscriptFormula(result.compound.formula) }}.
        </p>

        <CompoundInfo :compound="result.compound" />
      </template>

      <template v-else>
        <p class="result__tentative">
          <ChemFormula :formula="result.key" />
        </p>

        <!--
          El mensaje dice "no encontramos un compuesto compatible en la base de
          datos de ChemLab", NUNCA "esta combinación es imposible". La ausencia
          en un dataset de 30 entradas no dice nada sobre la química del mundo
          (SPEC 08 §7, SPEC 19 §6).
        -->
        <EmptyState
          title="Sin compuesto registrado"
          description="No encontramos un compuesto compatible en la base de datos de ChemLab para esta combinación."
        >
          <template #action>
            <RouterLink :to="{ name: 'lab' }" class="btn btn--primary">Editar mezcla</RouterLink>
          </template>
        </EmptyState>

        <section v-if="suggestions.length > 0" aria-labelledby="suggestions-heading">
          <h2 id="suggestions-heading" class="result__section">Probá con una de estas</h2>
          <ul class="result__suggestions">
            <li v-for="compound in suggestions" :key="compound.key">
              <!-- Los chips muestran `formula`, no `key`: se ve NaCl, no ClNa. -->
              <RouterLink
                class="btn btn--inline btn--ghost"
                :to="{ name: 'compound', params: { formula: compound.formula } }"
              >
                <ChemFormula :formula="compound.formula" :name="compound.name" />
              </RouterLink>
            </li>
          </ul>
        </section>
      </template>

      <div v-if="result" class="result__actions">
        <RouterLink :to="{ name: 'lab' }" class="btn btn--ghost">Volver a la mezcla</RouterLink>

        <div v-if="result.compound" class="result__favorite">
          <span>Favorito</span>
          <FavoriteStar
            :id="result.compound.formula"
            type="compound"
            :name="result.compound.name"
            :formula="result.compound.formula"
          />
        </div>
      </div>
    </div>

    <!-- ≥768 px: el resultado ya está en el panel lateral; acá va la tabla. -->
    <section class="result__table" aria-labelledby="result-grid-heading">
      <h2 id="result-grid-heading" class="result__section">Tabla periódica</h2>
      <PeriodicTable
        :elements="elements"
        :quantities="mixture.items.value"
        @select="openElement"
      />
    </section>
  </div>
</template>

<style scoped>
.result__main {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.result__table {
  display: none;
}

.result__banner {
  padding: var(--sp-3);
  border: 1px solid var(--accent-border);
  border-radius: var(--r-lg);
  background: color-mix(in oklch, var(--accent) 14%, transparent);
  color: var(--text-1);
  font-size: var(--fs-3);
  font-weight: 600;
}

.result__multiplier {
  color: var(--text-3);
  font-size: var(--fs-3);
}

.result__tentative {
  color: var(--text-1);
  font-size: var(--fs-7);
}

.result__section {
  margin-bottom: var(--sp-3);
  font-size: var(--fs-4);
}

.result__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.result__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-3);
}

.result__favorite {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  color: var(--text-2);
  font-size: var(--fs-3);
}

@media (min-width: 768px) {
  .result__main {
    display: none;
  }

  .result__table {
    display: block;
  }
}
</style>
