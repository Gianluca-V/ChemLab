/**
 * Favoritos — contrato en SPEC 02 §5, reglas completas en SPEC 10
 *
 * Un nombre por concepto (SPEC 10 §1):
 *   `rating` = estrellas  → en la interfaz se rotula "Valoración"
 *   `note`   = texto      → en la interfaz se rotula "Nota"
 *
 * El diseño llamaba "nota" a las estrellas y "mensaje" al texto; la descripción
 * funcional usaba "nota" para el texto. La colisión se resuelve acá y no se
 * reabre en ningún componente.
 */

import { computed, reactive } from 'vue';
import { KEYS, read, write } from '../services/storage.js';
import { useToast } from './useToast.js';

/** Longitud máxima de la nota (SPEC 07 §1, SPEC 10 §5). */
export const MAX_NOTE_LENGTH = 200;

/**
 * @param {unknown} raw
 * @returns {object[]}
 */
function sanitize(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry) =>
      entry &&
      typeof entry.id === 'string' &&
      (entry.type === 'element' || entry.type === 'compound') &&
      Number.isInteger(entry.rating) &&
      entry.rating >= 1 &&
      entry.rating <= 5
  );
}

const state = reactive({
  items: sanitize(read(KEYS.FAVORITES, [])),
});

const toast = useToast();

function persist() {
  if (!write(KEYS.FAVORITES, state.items)) toast.storageError();
}

/**
 * `id` es `symbol` para elementos y `formula` para compuestos, así que hace
 * falta el par id+type para desambiguar.
 *
 * @param {string} id
 * @param {'element'|'compound'} type
 * @returns {number}
 */
function indexOf(id, type) {
  return state.items.findIndex((entry) => entry.id === id && entry.type === type);
}

/**
 * @param {string} id
 * @param {'element'|'compound'} type
 * @returns {object|null}
 */
function find(id, type) {
  return state.items[indexOf(id, type)] ?? null;
}

export function useFavorites() {
  return {
    items: computed(() => state.items),
    count: computed(() => state.items.length),
    find,

    /**
     * @param {string} id
     * @param {'element'|'compound'} type
     * @returns {boolean}
     */
    has(id, type) {
      return indexOf(id, type) !== -1;
    },

    /**
     * Alta o edición, según exista. Devuelve la entrada resultante.
     *
     * @param {object} entry
     * @param {string} entry.id
     * @param {'element'|'compound'} entry.type
     * @param {string} entry.name
     * @param {string} [entry.formula]
     * @param {number} entry.rating   Entero 1–5, obligatorio
     * @param {string} [entry.note]   0–200 caracteres, opcional
     * @returns {object}
     */
    save({ id, type, name, formula = null, rating, note = '' }) {
      const now = new Date().toISOString();
      const at = indexOf(id, type);
      const clean = {
        id,
        type,
        name,
        formula,
        rating: Math.min(5, Math.max(1, Math.trunc(rating))),
        note: note.slice(0, MAX_NOTE_LENGTH),
      };

      if (at === -1) {
        state.items.push({ ...clean, createdAt: now, updatedAt: now });
      } else {
        state.items[at] = { ...state.items[at], ...clean, updatedAt: now };
      }

      persist();
      return find(id, type);
    },

    /**
     * Elimina un favorito. Pasa por hoja de confirmación (SPEC 15 §3): destruye
     * texto que el usuario escribió.
     *
     * @param {string} id
     * @param {'element'|'compound'} type
     */
    remove(id, type) {
      const at = indexOf(id, type);
      if (at === -1) return;
      state.items.splice(at, 1);
      persist();
    },
  };
}
