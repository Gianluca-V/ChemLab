<script setup>
/**
 * Ficha de compuesto — frame 10, SPEC 06 §3, SPEC 09 §5
 *
 * La ficha aparece en dos rutas distintas —/compound/:formula y /lab/result— y
 * se extrae acá: las dos vistas son envoltorios delgados que cambian solo el
 * marco.
 *
 * SEPARACIÓN DE FUENTES, visible en la interfaz (SPEC 02 §4):
 *   `Descripción`  sin atribución. Es contenido de ChemLab.
 *   Masa molecular, CID, SMILES, InChIKey e imagen, agrupados bajo la
 *   atribución `PubChem`.
 *
 * Si PubChem no responde, el bloque atribuido se reemplaza por el error parcial
 * y la ficha conserva fórmula, nombre, composición y descripción. El frame 11
 * depende exactamente de esto.
 *
 * Nunca innerHTML ni v-html con contenido de PubChem: se usa interpolación de
 * Vue, que escapa por defecto. `smiles` e `inchiKey` van como texto plano
 * dentro de <code> (SPEC 09 §6).
 */
import { onBeforeUnmount, ref, watch } from 'vue';
import { resolveCompoundInfo } from '../services/cache.js';
import ChemFormula from './ChemFormula.vue';
import ErrorState from './ErrorState.vue';
import SkeletonBlock from './SkeletonBlock.vue';

const props = defineProps({
  /** Identidad unificada: { key, formula, name, description, inDataset }. */
  compound: { type: Object, required: true },
  /**
   * Dato externo ya resuelto. Cuando llega, no se vuelve a consultar: la
   * identificación de la mezcla ya trajo esto de PubChem.
   */
  external: { type: Object, default: null },
});

const loading = ref(false);
const data = ref(null);
const error = ref(null);
/** Momento de guardado de una entrada vencida servida como respaldo. */
const staleSince = ref(null);
const attemptsUsed = ref(0);
const imageFailed = ref(false);

let cancelled = false;

/**
 * @param {boolean} skipCache  true cuando lo dispara el botón Reintentar
 */
async function load(skipCache = false) {
  loading.value = true;
  error.value = null;
  staleSince.value = null;
  imageFailed.value = false;

  const result = await resolveCompoundInfo(props.compound.key, {
    attemptsUsed: attemptsUsed.value,
    skipCache,
  });

  if (cancelled) return;

  attemptsUsed.value = result.attemptsUsed;
  data.value = result.data;
  error.value = result.status === 'error' ? result.error : null;
  staleSince.value = result.status === 'stale' ? result.storedAt : null;
  loading.value = false;
}

// El contador de intentos se reinicia al cambiar de compuesto (SPEC 09 §3).
watch(
  [() => props.compound.key, () => props.external],
  () => {
    attemptsUsed.value = 0;
    if (props.external) {
      // Ya resuelto por la identificación: no se repite la consulta.
      data.value = props.external;
      error.value = null;
      loading.value = false;
      return;
    }
    data.value = null;
    load();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  cancelled = true;
});

/** @param {number} timestamp */
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
</script>

<template>
  <article class="info">
    <header class="info__head">
      <ChemFormula
        class="info__formula"
        :formula="compound.formula"
        :name="compound.name"
      />
      <h2 class="info__name">{{ compound.name }}</h2>
    </header>

    <!-- Bloque atribuido a PubChem. Todo lo de acá abajo es dato externo. -->
    <section class="info__external" aria-labelledby="pubchem-heading">
      <h3 id="pubchem-heading" class="info__source">PubChem</h3>

      <SkeletonBlock v-if="loading" image :lines="3" />

      <ErrorState
        v-else-if="error"
        variant="inline"
        :error="error"
        :attempts-used="attemptsUsed"
        @retry="load(true)"
      />

      <template v-else-if="data">
        <p v-if="staleSince" class="info__stale">
          Información de PubChem del {{ formatDate(staleSince) }}.
        </p>

        <figure v-if="!imageFailed" class="info__figure">
          <img
            :src="data.imageUrl"
            :alt="`Estructura molecular ${compound.name.toLowerCase()}`"
            loading="lazy"
            @error="imageFailed = true"
          />
          <figcaption class="mono">estructura molecular · PubChem CID {{ data.cid }}</figcaption>
        </figure>
        <p v-else class="info__no-image">
          No pudimos cargar la imagen de la estructura molecular.
        </p>

        <dl class="info__props">
          <div>
            <dt>Masa molecular</dt>
            <dd class="mono">{{ data.molecularMass ?? '—' }}</dd>
          </div>
          <div>
            <dt>CID</dt>
            <dd class="mono">{{ data.cid }}</dd>
          </div>
          <div>
            <dt>SMILES</dt>
            <dd><code>{{ data.smiles ?? '—' }}</code></dd>
          </div>
          <div>
            <dt>InChIKey</dt>
            <dd><code>{{ data.inchiKey ?? '—' }}</code></dd>
          </div>
        </dl>

        <!--
          Descripción de PubChem, solo para compuestos que NO están en el
          dataset: los que sí están ya tienen la suya en español, escrita para
          este público, y mostrar las dos sería ruido.

          `lang="en"` no es decorativo: sin él un lector de pantalla en español
          pronuncia el texto inglés con fonemas castellanos y se vuelve
          ininteligible (SPEC 17).

          La fuente se pinta como TEXTO, nunca como enlace: `DescriptionURL`
          es un string arbitrario de una respuesta externa (SPEC 09 §6).
        -->
        <div v-if="compound.inDataset === false && data.description" class="info__desc">
          <h4 class="info__source">Descripción · en inglés</h4>
          <p lang="en">{{ data.description.text }}</p>
          <p v-if="data.description.source" class="info__attrib">
            Fuente: {{ data.description.source }}
          </p>
        </div>
      </template>
    </section>

    <!-- Dato interno de ChemLab. Sin atribución: es contenido propio. -->
    <section v-if="compound.description" class="info__internal" aria-labelledby="description-heading">
      <h3 id="description-heading" class="info__source">Descripción</h3>
      <p>{{ compound.description }}</p>
    </section>

    <!--
      Compuesto que PubChem conoce y ChemLab no. No se traduce el nombre ni se
      escribe una descripción propia: se dice de dónde salió todo y se deja
      claro que no cuenta para el progreso, cuyo denominador es el tamaño del
      dataset.
    -->
    <p v-else-if="compound.inDataset === false" class="info__foreign">
      Este compuesto no forma parte del set de ChemLab: lo identificamos
      consultando PubChem, así que su nombre y su descripción vienen en inglés,
      tal como los publica esa base. Tampoco suma al contador de
      descubrimientos.
    </p>
  </article>
</template>

<style scoped>
.info {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
}

.info__head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.info__formula {
  color: var(--text-1);
  font-size: var(--fs-7);
}

.info__name {
  color: var(--text-2);
  font-size: var(--fs-5);
  font-weight: 500;
}

.info__external,
.info__internal {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding: var(--sp-4);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
}

.info__source {
  color: var(--text-muted);
  font-size: var(--fs-1);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.info__stale {
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.info__figure {
  margin: 0;
}

.info__figure img {
  width: 100%;
  max-width: 18rem;
  border-radius: var(--r-md);
  background: var(--surface-3);
}

.info__figure figcaption {
  margin-top: var(--sp-2);
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.info__desc {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding-top: var(--sp-2);
  border-top: 1px solid var(--border);
  font-size: var(--fs-3);
}

.info__attrib {
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.info__foreign {
  padding: var(--sp-3);
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-lg);
  color: var(--text-3);
  font-size: var(--fs-2);
}

.info__no-image {
  padding: var(--sp-3);
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-md);
  color: var(--text-muted);
  font-size: var(--fs-2);
}

.info__props {
  display: grid;
  gap: var(--sp-3);
}

.info__props dt {
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.info__props dd {
  margin: 0;
  color: var(--text-1);
  font-size: var(--fs-3);
  overflow-wrap: anywhere;
}

@media (min-width: 481px) {
  .info__props {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
