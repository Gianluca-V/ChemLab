<script setup>
/**
 * Resultado de la combinación — frames 09, 10, 11, 22, 26; SPEC 08, SPEC 09
 *
 * NO es una vista de detalle: es el resultado de una acción. Por eso el
 * favorito va al pie, junto a su acción hermana "Volver a la mezcla", y por eso
 * NO registra historial. El frame 10 dibuja ese par y se respeta.
 *
 * La identificación consulta PRIMERO a PubChem y cae al dataset local o a la
 * caché cuando la red no responde (ver el desvío registrado en
 * services/compounds.js). Eso agrega un estado de carga para la
 * IDENTIFICACIÓN, no solo para el enriquecimiento como preveía SPEC 09 §5: sin
 * red, saber si la mezcla corresponde a algo puede tardar hasta 16 segundos.
 */
import { computed, ref, watch } from 'vue';

import ChemFormula from '../components/ChemFormula.vue';
import CompoundInfo from '../components/CompoundInfo.vue';
import EmptyState from '../components/EmptyState.vue';
import ErrorState from '../components/ErrorState.vue';
import FavoriteStar from '../components/FavoriteStar.vue';
import SkeletonBlock from '../components/SkeletonBlock.vue';

import { allCompounds } from '../services/compounds.js';
import { suggest } from '../services/chemistry.js';
import { useDiscoveries } from '../composables/useDiscoveries.js';
import { useMixture } from '../composables/useMixture.js';

const mixture = useMixture();
const discoveries = useDiscoveries();

const isNewDiscovery = ref(false);
const attemptsUsed = ref(0);

const result = computed(() => mixture.result.value);

/**
 * Identifica si hace falta. Se dispara también al entrar por URL pegada o tras
 * una recarga: la mezcla persiste, pero la identificación vive en memoria.
 *
 * @param {boolean} skipCache  true cuando lo dispara el botón Reintentar
 */
async function identify(skipCache = false) {
  if (mixture.isEmpty.value) return;

  const found = await mixture.identify({ attemptsUsed: attemptsUsed.value, skipCache });
  attemptsUsed.value = found && found.error ? attemptsUsed.value + 1 : 0;

  /*
    El descubrimiento se registra UNA sola vez, la primera, y SOLO para
    compuestos del dataset: el progreso se mide contra el tamaño de
    compounds.json, así que un compuesto que solo conoce PubChem no tiene dónde
    sumar.

    `status: 'multiple'` es idéntico a `'exact'` a estos efectos: el
    multiplicador no cambia qué compuesto se identificó.
  */
  isNewDiscovery.value =
    found && found.compound && found.compound.inDataset
      ? discoveries.record(found.compound.key)
      : false;
}

watch(
  () => mixture.tentativeKey.value,
  () => {
    if (!mixture.result.value) identify();
  },
  { immediate: true }
);

/** Hasta 4 sugerencias, solo entre los no descubiertos (SPEC 08 §7). */
const suggestions = computed(() => {
  if (!result.value || result.value.compound) return [];
  return suggest({
    mixture: mixture.items.value,
    compounds: allCompounds(),
    discoveredKeys: discoveries.keySet.value,
  });
});

/**
 * Falló la red y no hubo respaldo: no sabemos si la mezcla corresponde a algo.
 * Es distinto de que PubChem haya contestado que no existe (`not-found`).
 */
const undetermined = computed(
  () =>
    result.value &&
    result.value.status === 'none' &&
    result.value.error &&
    result.value.error.type !== 'not-found'
);
</script>

<template>
  <div class="result">
    <!-- Mezcla vacía: no hay nada que combinar. -->
    <EmptyState
      v-if="mixture.isEmpty.value"
      icon="⚗"
      title="Tu mezcla está vacía"
      description="Seleccioná elementos de la tabla periódica para comenzar."
    >
      <template #action>
        <RouterLink :to="{ name: 'lab' }" class="btn btn--primary">
          Abrir tabla periódica
        </RouterLink>
      </template>
    </EmptyState>

    <SkeletonBlock
      v-else-if="mixture.identifying.value"
      label="Identificando la combinación…"
      :lines="3"
      image
    />

    <template v-else-if="result && result.compound">
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
        Tu mezcla equivale a {{ result.multiplier }} unidades de {{ result.compound.formula }}.
      </p>

      <CompoundInfo :compound="result.compound" :external="result.external" />
    </template>

    <!--
      La red falló y no hubo respaldo. NO se dice "sin compuesto registrado":
      no lo sabemos. Afirmar que no existe cuando lo que falló fue la consulta
      sería el mismo tipo de afirmación sin respaldo que SPEC 19 §6 prohíbe.
    -->
    <ErrorState
      v-else-if="undetermined"
      variant="view"
      :error="result.error"
      :context="result.key"
      :attempts-used="attemptsUsed"
      @retry="identify(true)"
    >
      <template #secondary>
        <RouterLink :to="{ name: 'lab' }" class="btn btn--ghost">Editar mezcla</RouterLink>
      </template>
    </ErrorState>

    <template v-else-if="result">
      <p class="result__tentative">
        <ChemFormula :formula="result.key" />
      </p>

      <!--
        El mensaje dice "no encontramos un compuesto compatible", NUNCA "esta
        combinación es imposible" (SPEC 08 §7, SPEC 19 §6).
      -->
      <EmptyState
        title="Sin compuesto registrado"
        description="No encontramos un compuesto compatible para esta combinación, ni en la base de datos de ChemLab ni en PubChem."
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

    <div v-if="!mixture.isEmpty.value && !mixture.identifying.value" class="result__actions">
      <RouterLink :to="{ name: 'lab' }" class="btn btn--ghost">Volver a la mezcla</RouterLink>

      <!--
        Solo se marca favorito un compuesto del dataset: el favorito guarda
        `formula` como id y la lista se resuelve contra compounds.json.
      -->
      <div v-if="result && result.compound && result.compound.inDataset" class="result__favorite">
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
</template>

<style scoped>
.result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
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
</style>
