<script setup>
/**
 * Detalle de elemento — frame 06, SPEC 06 §2
 *
 * SIN estado de carga. El dataset ya está en memoria cuando la vista se monta;
 * pintar un skeleton para un lookup en un Map es simular latencia que no existe.
 *
 * `null` se pinta como `—`. Nunca 0, nunca `null`, nunca celda vacía: un guión
 * declara "no disponible", una celda vacía parece un error de la aplicación.
 *
 * Esta vista NO contiene lógica de historial. El registro lo hace el
 * router.afterEach de SPEC 01 §5.
 *
 * La estrella de favorito vive en el TopBar, que resuelve App.vue.
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import EmptyState from '../components/EmptyState.vue';
import { CATEGORY_LABELS_SINGULAR, getElement, STATE_LABELS } from '../services/elements.js';
import { useMixture } from '../composables/useMixture.js';

const route = useRoute();
const mixture = useMixture();

const element = computed(() => getElement(String(route.params.symbol)));

const quantity = computed(() =>
  element.value ? mixture.quantityOf(element.value.symbol) : 0
);

/**
 * Lantánidos y actínidos tienen `group: null`: la línea pasa de
 * "No metal · Grupo 16 · Período 2" a "Lantánido · Período 6". No se imprime
 * "Grupo —".
 */
const identity = computed(() => {
  if (!element.value) return '';
  const parts = [CATEGORY_LABELS_SINGULAR[element.value.category]];
  if (element.value.group !== null) parts.push(`Grupo ${element.value.group}`);
  parts.push(`Período ${element.value.period}`);
  return parts.join(' · ');
});

/**
 * @param {number|null} value
 * @param {string} [unit]
 * @returns {string}
 */
function show(value, unit = '') {
  if (value === null || value === undefined) return '—';
  return unit ? `${value} ${unit}` : String(value);
}

const oxidation = computed(() => {
  const states = element.value?.oxidationStates ?? [];
  if (states.length === 0) return '—';
  // Signo menos tipográfico: −2, no -2. El 0 va sin signo.
  return states
    .map((n) => (n < 0 ? `−${Math.abs(n)}` : n === 0 ? '0' : `+${n}`))
    .join(', ');
});

const addLabel = computed(() =>
  quantity.value > 0
    ? `Añadir otro · en la mezcla (${quantity.value})`
    : 'Añadir al laboratorio'
);
</script>

<template>
  <article v-if="element" class="detail">
    <header class="detail__identity">
      <p class="detail__numbers">
        <span class="mono detail__z">{{ element.atomicNumber }}</span>
        <span class="detail__symbol">{{ element.symbol }}</span>
        <span class="mono detail__mass">{{ element.atomicMass }}</span>
      </p>

      <p class="detail__name">{{ element.name }}</p>
      <p class="detail__meta">{{ identity }}</p>

      <p class="detail__tags">
        <!-- hazard es null en la mayoría: el tag no se renderiza y no queda hueco. -->
        <span v-if="element.hazard" class="detail__hazard">
          <span aria-hidden="true">{{ element.hazard.icon }}</span>
          {{ element.hazard.label }}
        </span>
        <span class="detail__state">{{ STATE_LABELS[element.state] }}</span>
      </p>
    </header>

    <section aria-labelledby="props-heading">
      <h2 id="props-heading" class="detail__section">Propiedades</h2>

      <!-- Pares nombre-valor, no datos tabulares: <dl>, no <table>. -->
      <dl class="detail__props">
        <div>
          <dt>Configuración</dt>
          <dd class="mono">{{ element.electronConfiguration }}</dd>
        </div>
        <div>
          <dt>Electronegatividad</dt>
          <dd>{{ show(element.electronegativity) }}</dd>
        </div>
        <div>
          <dt>Fusión</dt>
          <dd>{{ show(element.meltingPoint, '°C') }}</dd>
        </div>
        <div>
          <dt>Ebullición</dt>
          <dd>{{ show(element.boilingPoint, '°C') }}</dd>
        </div>
        <div>
          <dt>Densidad</dt>
          <dd>{{ show(element.density, element.state === 'gas' ? 'g/L' : 'g/cm³') }}</dd>
        </div>
        <div>
          <dt>Oxidación</dt>
          <dd>{{ oxidation }}</dd>
        </div>
      </dl>
    </section>

    <section aria-labelledby="about-heading">
      <h2 id="about-heading" class="detail__section">Sobre el elemento</h2>
      <p class="detail__text">{{ element.description }}</p>
    </section>

    <!--
      Bloque "Qué significan estas propiedades" del frame 06, íntegro. Es la
      única pieza de los 28 frames que enseña en lugar de listar, y cumple
      directamente con la regla de comunicación científica: el O2 es oxidante,
      favorece la combustión sin ser él mismo combustible.
      glossary es null en la mayoría: el bloque completo se omite con su
      encabezado.
    -->
    <section v-if="element.glossary" aria-labelledby="glossary-heading">
      <h2 id="glossary-heading" class="detail__section">Qué significan estas propiedades</h2>
      <p class="detail__text">{{ element.glossary }}</p>
    </section>

    <div class="detail__actions">
      <button
        type="button"
        class="btn btn--primary"
        :aria-disabled="!mixture.canAdd(element.symbol)"
        @click="mixture.add(element.symbol)"
      >
        {{ addLabel }}
      </button>
      <p v-if="!mixture.canAdd(element.symbol)" class="detail__hint">
        Alcanzaste el límite de átomos para este elemento o para la mezcla.
      </p>
    </div>
  </article>

  <!--
    Símbolo inexistente: la ruta es válida, el recurso no. No se redirige a
    not-found (SPEC 01 §3).
  -->
  <EmptyState
    v-else
    icon="🔍"
    title="No encontramos ese elemento"
    :description="`«${route.params.symbol}» no corresponde a ninguno de los 118 elementos.`"
  >
    <template #action>
      <RouterLink :to="{ name: 'lab' }" class="btn btn--primary">
        Abrir tabla periódica
      </RouterLink>
    </template>
  </EmptyState>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
}

.detail__identity {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.detail__numbers {
  display: flex;
  align-items: baseline;
  gap: var(--sp-3);
}

.detail__z {
  color: var(--text-3);
  font-size: var(--fs-4);
}

.detail__symbol {
  color: var(--text-1);
  font-size: var(--fs-7);
  font-weight: 700;
  line-height: 1;
}

.detail__mass {
  color: var(--text-muted);
  font-size: var(--fs-3);
}

.detail__name {
  color: var(--text-1);
  font-size: var(--fs-6);
  font-weight: 600;
}

.detail__meta {
  color: var(--text-3);
  font-size: var(--fs-3);
}

.detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.detail__hazard,
.detail__state {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 0 var(--sp-2);
  border-radius: var(--r-sm);
  font-size: var(--fs-1);
  line-height: 1.9;
}

.detail__hazard {
  background: color-mix(in oklch, var(--hazard) 18%, transparent);
  color: var(--hazard-text);
}

.detail__state {
  background: var(--chip-bg);
  color: var(--text-3);
}

.detail__section {
  margin-bottom: var(--sp-3);
  font-size: var(--fs-4);
}

.detail__props {
  display: grid;
  gap: var(--sp-3);
  padding: var(--sp-4);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
}

.detail__props dt {
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.detail__props dd {
  margin: 0;
  color: var(--text-1);
  font-size: var(--fs-3);
  overflow-wrap: anywhere;
}

.detail__text {
  max-width: 68ch;
  color: var(--text-2);
}

.detail__actions {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  align-items: flex-start;
}

.detail__hint {
  color: var(--text-muted);
  font-size: var(--fs-1);
}

@media (min-width: 481px) {
  .detail__props {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
