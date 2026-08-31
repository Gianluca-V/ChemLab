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
import { compoundCount } from '../services/compounds.js';
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

function persist() {
  if (!write(KEYS.DISCOVERED, state.keys)) toast.storageError();
}

const keySet = computed(() => new Set(state.keys));

export function useDiscoveries() {
  return {
    keys: computed(() => state.keys),
    keySet,
    count: computed(() => state.keys.length),
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
