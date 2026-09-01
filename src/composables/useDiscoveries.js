/**
 * Compuestos descubiertos — SPEC 08 §8, SPEC 12
 *
 * Indexado por la clave canónica de Hill, NO por `formula`: es la misma clave
 * con la que el motor identifica el compuesto.
 *
 * Se registra una sola vez, la primera. `status: 'multiple'` es idéntico a
 * `status: 'exact'` a estos efectos: el multiplicador no cambia qué compuesto
 * se identificó.
 *
 * Sin `discoveredAt`: ninguna pantalla lo muestra, así que no se almacena.
 */

import { computed, reactive } from 'vue';
import { KEYS, read, write } from '../services/storage.js';
import { compoundCount, getCompoundByKey } from '../services/compounds.js';
import { useToast } from './useToast.js';

/**
 * Acepta tanto el formato actual —array de claves— como el intermedio con
 * objetos `{ key }`, por si quedó algo guardado de una versión anterior.
 *
 * @param {unknown} raw
 * @returns {string[]}
 */
function sanitize(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => (typeof entry === 'string' ? entry : entry?.key))
    .filter((key) => typeof key === 'string' && key.length > 0);
}

const state = reactive({
  keys: sanitize(read(KEYS.DISCOVERED, [])),
});

const toast = useToast();

/**
 * Depura las claves que ya no existen en el dataset y persiste (SPEC 12 §8).
 *
 * La depuracion se saltea mientras `compoundCount()` es 0: el dataset se carga
 * por fetch, y purgar antes de que llegue borraria el progreso entero.
 */
function persist() {
  if (compoundCount() > 0) {
    const known = state.keys.filter((key) => Boolean(getCompoundByKey(key)));
    if (known.length !== state.keys.length) state.keys = known;
  }

  if (!write(KEYS.DISCOVERED, state.keys)) toast.storageError();
}

const keySet = computed(() => new Set(state.keys));

/**
 * Claves presentes en el dataset. El contador cuenta sobre esto y no sobre el
 * array crudo: si el dataset se achica, `8 / 30` nunca puede mostrar `31 / 30`
 * (SPEC 12 §8).
 */
const knownKeys = computed(() =>
  compoundCount() === 0 ? [] : state.keys.filter((key) => Boolean(getCompoundByKey(key)))
);

export function useDiscoveries() {
  return {
    keys: knownKeys,
    keySet,
    count: computed(() => knownKeys.value.length),
    /** Denominador del progreso. Sale del dataset: nunca se escribe 30 a mano. */
    total: computed(() => compoundCount()),

    /** @param {string} key */
    has(key) {
      return keySet.value.has(key);
    },

    /**
     * Registra un descubrimiento.
     *
     * @param {string} key  Clave canónica de Hill
     * @returns {boolean} true si es la primera vez — dispara el banner del frame 10
     */
    record(key) {
      if (!key || keySet.value.has(key)) return false;
      state.keys.push(key);
      persist();
      return true;
    },
  };
}
