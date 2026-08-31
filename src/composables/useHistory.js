/**
 * Historial de detalles visitados — SPEC 01 §5, SPEC 11
 *
 * Registra EXCLUSIVAMENTE visitas a /element/:symbol y /compound/:formula. No
 * registra búsquedas, ni filtros aplicados, ni combinaciones probadas en el
 * laboratorio, ni la visita a /lab/result. Las combinaciones probadas
 * pertenecen a Descubrimientos, no acá.
 *
 * SIN FECHA NI HORA. El orden del array es toda la información temporal que se
 * guarda: sin timestamp no hay agrupación por día que hacer, y ninguna pantalla
 * la muestra.
 *
 * Deduplicación de CONSECUTIVOS, no global: A,B,A son tres entradas; A,A,A es
 * una. Volver a un detalle después de haber visto otro es una visita nueva.
 */

import { computed, reactive } from 'vue';
import { KEYS, read, write } from '../services/storage.js';
import { useToast } from './useToast.js';

/** Tope de entradas. Al superarlo se descarta la más vieja. */
export const MAX_ENTRIES = 100;

/**
 * @param {unknown} raw
 * @returns {{id: string, type: 'element'|'compound'}[]}
 */
function sanitize(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (entry) =>
        entry &&
        typeof entry.id === 'string' &&
        (entry.type === 'element' || entry.type === 'compound')
    )
    .map((entry) => ({ id: entry.id, type: entry.type }))
    .slice(0, MAX_ENTRIES);
}

const state = reactive({
  items: sanitize(read(KEYS.HISTORY, [])),
});

const toast = useToast();

function persist() {
  if (!write(KEYS.HISTORY, state.items)) toast.storageError();
}

export function useHistory() {
  return {
    /** Más reciente primero. */
    items: computed(() => state.items),
    count: computed(() => state.items.length),

    /**
     * Registra una visita. Lo llama el router.afterEach de SPEC 01 §5, en un
     * único punto: ninguna vista contiene lógica de historial.
     *
     * @param {{id: string, type: 'element'|'compound'}} entry
     */
    record({ id, type }) {
      const previous = state.items[0];
      if (previous && previous.id === id && previous.type === type) return;

      state.items.unshift({ id, type });
      if (state.items.length > MAX_ENTRIES) state.items.length = MAX_ENTRIES;
      persist();
    },

    /** Vacía el historial. Pasa por hoja de confirmación (SPEC 11, SPEC 15 §3). */
    clear() {
      state.items = [];
      persist();
    },
  };
}
