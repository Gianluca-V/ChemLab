<script setup>
/**
 * Panel de mezcla — frames 07 y 08; como <aside>, frames 27 y 28
 *
 * Lo renderiza el shell en TODAS las rutas: debajo del contenido por debajo de
 * 1024 px y al costado desde ahí. Lee useMixture(), que es un singleton, así
 * que tocar una celda de la tabla lo actualiza sin ningún cableado extra.
 *
 * Comunicación científica (SPEC 07 §7, SPEC 19 §6):
 *   · Se titula "Tu mezcla", no "Tu reacción". No hay reacción: hay una
 *     composición.
 *   · El rótulo es "Fórmula tentativa", no "Producto".
 *   · En ningún punto se afirma que juntar esos elementos produzca el compuesto
 *     en condiciones reales.
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMixture, MAX_TOTAL_ATOMS } from '../composables/useMixture.js';
import { useDiscoveries } from '../composables/useDiscoveries.js';
import { getElement } from '../services/elements.js';
import ChemFormula from './ChemFormula.vue';
import EmptyState from './EmptyState.vue';
import MixtureRow from './MixtureRow.vue';
import ProgressBar from './ProgressBar.vue';

const props = defineProps({
  /**
   * `aside` suma el bloque de resultado y el progreso de descubrimientos.
   * `view` es la forma desnuda, por si hace falta embeberlo en otra pantalla.
   */
  variant: {
    type: String,
    default: 'aside',
    validator: (value) => ['view', 'aside'].includes(value),
  },
});

const router = useRouter();
const mixture = useMixture();
const discoveries = useDiscoveries();

/** Filas ordenadas por número atómico: el orden de la mezcla no es dato. */
const rows = computed(() =>
  Object.keys(mixture.items.value)
    .map((symbol) => ({ element: getElement(symbol), quantity: mixture.items.value[symbol] }))
    .filter((row) => row.element !== null)
    .sort((a, b) => a.element.atomicNumber - b.element.atomicNumber)
);

/**
 * Un chip por ÁTOMO, no por elemento: repiten el símbolo tantas veces como su
 * cantidad. Es la representación literal de la selección, antes de normalizar.
 * Junto a la fórmula tentativa muestran las dos caras del mismo dato.
 */
const atomChips = computed(() =>
  rows.value.flatMap((row) => Array.from({ length: row.quantity }, () => row.element.symbol))
);

/** Se habilita con 2 o más ÁTOMOS totales. Se cuentan átomos, no filas. */
const canCombine = computed(() => mixture.totalAtoms.value >= 2);

const atLimit = computed(() => mixture.totalAtoms.value >= MAX_TOTAL_ATOMS);

/**
 * Resultado para el bloque compacto. Sale de la identificación que hace
 * useMixture, así que el panel y la vista de resultado muestran siempre lo
 * mismo sin repetir la consulta a PubChem.
 */
const result = computed(() => mixture.result.value);

/**
 * COMBINAR navega de inmediato y deja que ResultView dispare la identificación:
 * bloquear la navegación hasta que PubChem conteste dejaría al usuario mirando
 * un botón muerto hasta 16 segundos.
 */
function combine() {
  if (!canCombine.value) return;
  mixture.markCombined();
  router.push({ name: 'lab-result' });
}

/**
 * Abre el detalle del elemento. Con el tap de la celda reasignado a "agregar a
 * la mezcla", ésta es la vía al detalle desde el laboratorio y, por lo tanto,
 * la que alimenta el historial (SPEC 01 §5).
 *
 * @param {string} symbol
 */
function openDetail(symbol) {
  router.push({ name: 'element', params: { symbol } });
}

/** @param {string} symbol */
function decrease(symbol) {
  const current = mixture.quantityOf(symbol);
  if (current <= 1) mixture.remove(symbol);
  else mixture.setQuantity(symbol, current - 1);
}
</script>

<template>
  <section class="panel" :class="`panel--${variant}`" aria-labelledby="mixture-heading">
    <div class="panel__head">
      <h2 id="mixture-heading">Tu mezcla</h2>
      <p v-if="!mixture.isEmpty.value" class="panel__count mono">
        {{ mixture.totalAtoms.value }} {{ mixture.totalAtoms.value === 1 ? 'átomo' : 'átomos' }}
      </p>
    </div>

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

    <template v-else>
      <!--
        Se muestra la clave canónica de Hill y no una forma embellecida: la
        pantalla está mostrando el trabajo del normalizador. Para Na y Cl dice
        ClNa, no NaCl, porque ClNa es exactamente la clave que el motor va a
        buscar en el índice. La fórmula convencional aparece en el resultado.
      -->
      <div class="panel__tentative">
        <p class="panel__label">Fórmula tentativa</p>
        <ChemFormula class="panel__formula" :formula="mixture.tentativeKey.value" />
      </div>

      <ul class="panel__atoms" aria-label="Átomos seleccionados">
        <li v-for="(symbol, index) in atomChips" :key="`${symbol}-${index}`" class="panel__atom">
          {{ symbol }}
        </li>
      </ul>

      <ul class="panel__rows">
        <MixtureRow
          v-for="row in rows"
          :key="row.element.symbol"
          :element="row.element"
          :quantity="row.quantity"
          :can-increase="mixture.canAdd(row.element.symbol)"
          @increase="mixture.add"
          @decrease="decrease"
          @open="openDetail"
        />
      </ul>

      <p v-if="atLimit" class="panel__limit" role="status">
        Límite de {{ MAX_TOTAL_ATOMS }} átomos alcanzado
      </p>

      <p class="panel__note">
        El orden de selección no importa: H + O + H y O + H + H generan la misma combinación
        normalizada.
      </p>

      <!--
        aria-disabled y no disabled: un botón con `disabled` sale del orden de
        tabulación, con lo que un usuario de teclado no llega nunca al texto que
        explica por qué está bloqueado. El click verifica la condición.
      -->
      <div class="panel__actions">
        <button type="button" class="btn btn--primary" :aria-disabled="!canCombine" @click="combine">
          COMBINAR
        </button>
        <p v-if="!canCombine" class="panel__hint">Agregá al menos 2 átomos para combinar</p>

        <button type="button" class="btn btn--ghost" @click="mixture.clear">Limpiar</button>
      </div>

      <!-- Bloque de resultado del frame 28: solo en el panel lateral. -->
      <div v-if="variant === 'aside' && (result || mixture.identifying.value)" class="panel__result">
        <h3 class="panel__label">Resultado</h3>

        <p v-if="mixture.identifying.value" class="panel__hint" role="status">
          Identificando la combinación…
        </p>

        <template v-else-if="result && result.compound">
          <p class="panel__result-name">
            <ChemFormula :formula="result.compound.formula" :name="result.compound.name" />
            <span>{{ result.compound.name }}</span>
          </p>
          <p v-if="result.multiplier > 1" class="panel__hint">
            Tu mezcla equivale a {{ result.multiplier }} unidades de {{ result.compound.formula }}.
          </p>
          <RouterLink
            v-if="result.compound.inDataset"
            class="btn btn--inline btn--ghost"
            :to="{ name: 'compound', params: { formula: result.compound.formula } }"
          >
            Ver la ficha completa
          </RouterLink>
          <RouterLink v-else class="btn btn--inline btn--ghost" :to="{ name: 'lab-result' }">
            Ver el resultado
          </RouterLink>
        </template>

        <template v-else-if="result">
          <p class="panel__hint">
            No encontramos un compuesto compatible para esta combinación.
          </p>
        </template>
      </div>
    </template>

    <div v-if="variant === 'aside'" class="panel__progress">
      <ProgressBar
        :value="discoveries.count.value"
        :max="discoveries.total.value"
        label="Descubiertos"
      />
    </div>
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.panel--aside {
  padding: var(--sp-4);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
}

.panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-2);
}

.panel__count {
  color: var(--text-3);
  font-size: var(--fs-2);
}

.panel__label {
  color: var(--text-muted);
  font-size: var(--fs-1);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.panel__tentative {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.panel__formula {
  color: var(--text-1);
  font-size: var(--fs-6);
}

.panel__atoms {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
}

.panel__atom {
  display: grid;
  place-items: center;
  min-width: var(--sp-6);
  height: var(--sp-6);
  padding: 0 var(--sp-2);
  border-radius: var(--r-sm);
  background: var(--chip-bg);
  color: var(--text-2);
  font-family: var(--font-mono);
  font-size: var(--fs-2);
}

.panel__rows {
  border-top: 1px solid var(--border);
}

.panel__limit {
  color: var(--hazard-text);
  font-size: var(--fs-2);
}

.panel__note {
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.panel__actions {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.panel__hint {
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.panel__result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  align-items: flex-start;
  padding-top: var(--sp-3);
  border-top: 1px solid var(--border);
}

.panel__result-name {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--sp-2);
  color: var(--text-1);
  font-size: var(--fs-4);
}

.panel__progress {
  padding-top: var(--sp-3);
  border-top: 1px solid var(--border);
}
</style>
