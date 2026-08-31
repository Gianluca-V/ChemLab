/**
 * Estado del laboratorio — SPEC 07
 *
 * Un único objeto `{ H: 2, O: 1 }`, con el mismo shape que el campo `elements`
 * de un compuesto: se pasa directo a hillKey() sin transformación intermedia.
 *
 * El orden de selección es irrelevante POR CONSTRUCCIÓN. H+O+H, H+H+O y O+H+H
 * producen el mismo objeto porque el estado es un mapa de símbolo a cantidad,
 * no una lista. No hay ningún paso que "elimine" el orden: nunca existió.
 *
 * Persiste en cada mutación: la mezcla sobrevive a la navegación, a la recarga
 * y al cierre del navegador. Eso es lo que hace cierto el mensaje del frame 22.
 */

import { computed, reactive } from 'vue';
import { KEYS, read, write } from '../services/storage.js';
import { hillKey, subscriptFormula, totalAtoms as sumAtoms } from '../services/chemistry.js';
import { getElement } from '../services/elements.js';
import { identifyMixture } from '../services/compounds.js';
import { useToast } from './useToast.js';

/** Cantidad máxima por elemento. */
export const MAX_PER_ELEMENT = 20;

/**
 * Átomos totales máximos. Ningún compuesto del dataset pasa de 24 átomos, así
 * que los topes no restringen ningún caso legítimo: existen para que el estado
 * no pueda volverse absurdo y para que el "+" nunca sea un botón sin efecto.
 */
export const MAX_TOTAL_ATOMS = 50;

/**
 * Sanea lo leído de localStorage: solo símbolos conocidos con cantidad entera
 * positiva. Un dato corrupto no debe romper el arranque.
 *
 * @param {unknown} raw
 * @returns {Record<string, number>}
 */
function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const clean = {};
  for (const [symbol, quantity] of Object.entries(raw)) {
    const n = Number(quantity);
    if (Number.isInteger(n) && n > 0) clean[symbol] = Math.min(n, MAX_PER_ELEMENT);
  }
  return clean;
}

const state = reactive({
  items: sanitize(read(KEYS.MIXTURE, {})),
  /**
   * true después de COMBINAR. No persiste: el resultado es consecuencia de una
   * acción, no estado guardado. Cualquier mutación de la mezcla lo baja.
   */
  combined: false,
  /** Identificación en curso contra PubChem. */
  identifying: false,
  /** Última identificación. En memoria: no sobrevive a una recarga. */
  result: null,
});

/** Nombres acumulados en la ráfaga de toasts en curso (SPEC 15 §2). */
let burstNames = [];

const toast = useToast();

function persist() {
  if (!write(KEYS.MIXTURE, state.items)) toast.storageError();
}

/**
 * Toda mutación invalida la identificación: el resultado que se está mostrando
 * corresponde a una composición que ya no es la actual.
 */
function invalidate() {
  state.combined = false;
  state.result = null;
}

const totalAtoms = computed(() => sumAtoms(state.items));
const elementCount = computed(() => Object.keys(state.items).length);
const tentativeKey = computed(() => hillKey(state.items));

/**
 * Etiqueta y detalle del toast de agregado, con acumulación.
 *
 * A partir de 3 acumulados la línea secundaria muestra la fórmula tentativa en
 * lugar de enumerar nombres: enumerar seis elementos no entra en 390 px.
 *
 * @param {number} count
 * @returns {{title: string, detail: string}}
 */
function addToastFormat(count) {
  const title = count === 1 ? 'Añadido al laboratorio' : `${count} añadidos al laboratorio`;
  const detail =
    count >= 3
      ? `${subscriptFormula(hillKey(state.items))} tentativo`
      : burstNames.join(', ');
  return { title, detail };
}

/** @param {string} symbol */
function quantityOf(symbol) {
  return state.items[symbol] ?? 0;
}

/**
 * ¿Se puede sumar un átomo más de este elemento? Falso al llegar a 20 en el
 * elemento o a 50 átomos totales.
 *
 * @param {string} symbol
 * @returns {boolean}
 */
function canAdd(symbol) {
  return quantityOf(symbol) < MAX_PER_ELEMENT && totalAtoms.value < MAX_TOTAL_ATOMS;
}

export function useMixture() {
  return {
    items: computed(() => state.items),
    totalAtoms,
    elementCount,
    tentativeKey,
    isEmpty: computed(() => elementCount.value === 0),
    combined: computed(() => state.combined),
    identifying: computed(() => state.identifying),
    result: computed(() => state.result),
    quantityOf,
    canAdd,

    /**
     * Suma un átomo y dispara el toast de confirmación. No navega: quien lo
     * llama —el detalle, la tarjeta de resultado— deja al usuario donde estaba.
     *
     * @param {string} symbol
     * @returns {boolean} false si el límite lo impidió
     */
    add(symbol) {
      if (!canAdd(symbol)) return false;

      const previous = { ...state.items };
      state.items[symbol] = (state.items[symbol] ?? 0) + 1;
      invalidate();
      persist();

      const name = getElement(symbol)?.name ?? symbol;
      const isBurst = toast.toast.value?.type === 'mixture-add';
      burstNames = isBurst ? [...burstNames, name] : [name];

      toast.show({
        type: 'mixture-add',
        accumulate: true,
        format: addToastFormat,
        undo: () => {
          state.items = previous;
          invalidate();
          persist();
        },
      });

      return true;
    },

    /**
     * Fija la cantidad. `n === 0` elimina la entrada: el "−" en cantidad 1 borra
     * la fila, no deja una fila fantasma en cero.
     *
     * @param {string} symbol
     * @param {number} n
     */
    setQuantity(symbol, n) {
      const clamped = Math.min(Math.max(0, Math.trunc(n)), MAX_PER_ELEMENT);
      if (clamped === 0) {
        delete state.items[symbol];
      } else {
        state.items[symbol] = clamped;
      }
      invalidate();
      persist();
    },

    /** @param {string} symbol */
    remove(symbol) {
      delete state.items[symbol];
      invalidate();
      persist();
    },

    /**
     * Vacía la mezcla. NO abre hoja de confirmación: la mezcla es un estado de
     * trabajo, se rehace en tres toques y limpiarla es frecuente. Deshacer cubre
     * el error real —el toque accidental— mejor que confirmar, porque no le
     * cobra un paso a las veces que sí querías limpiar.
     */
    clear() {
      const previous = { ...state.items };
      state.items = {};
      invalidate();
      persist();

      toast.show({
        type: 'mixture-clear',
        title: 'Mezcla vaciada',
        detail: 'Se quitaron todos los elementos.',
        undo: () => {
          state.items = previous;
          invalidate();
          persist();
        },
      });
    },

    /** Marca que se ejecutó COMBINAR. Lo consume el panel lateral y ResultView. */
    markCombined() {
      state.combined = true;
    },

    /**
     * Identifica la mezcla actual. Consulta PRIMERO a PubChem y cae al dataset
     * local o a la caché si la red no responde (ver el desvío registrado en
     * services/compounds.js).
     *
     * El resultado queda en memoria para que el panel y la vista de resultado
     * muestren lo mismo sin repetir la consulta.
     *
     * @param {object} [options]
     * @returns {Promise<object|null>}
     */
    async identify(options = {}) {
      if (elementCount.value === 0) return null;

      state.identifying = true;
      state.combined = true;
      try {
        state.result = await identifyMixture({ ...state.items }, options);
        return state.result;
      } finally {
        state.identifying = false;
      }
    },
  };
}
