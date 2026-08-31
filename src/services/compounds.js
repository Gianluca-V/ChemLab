/**
 * Dataset de compuestos — SPEC 02 §2, §6; matching en SPEC 08
 *
 * JavaScript plano: no importa vue, no toca el DOM.
 *
 * El motor de combinacion nunca recorre el array: normaliza la mezcla a una
 * clave de Hill y hace un unico lookup en `byKey`.
 */

import { hillKey, match } from './chemistry.js';

const DATASET_URL = `${import.meta.env.BASE_URL}data/compounds.json`;

let loadPromise = null;
let all = [];
let byKey = new Map();
let byFormula = new Map();

/**
 * Carga el dataset una sola vez y construye los indices al resolver.
 *
 * `key` es dato derivado de `elements` (SPEC 02 §2.2): se incluye en el archivo
 * solo para evitar recalcular 30 claves en cada arranque. Como dato duplicado
 * puede desincronizarse, asi que en desarrollo se valida que
 * `key === hillKey(elements)` para toda entrada y se falla ruidosamente si no.
 * Un dataset inconsistente rompe el motor en silencio; es preferible que rompa
 * temprano y fuerte.
 *
 * @returns {Promise<object[]>}
 */
export function loadCompounds() {
  if (loadPromise) return loadPromise;

  loadPromise = fetch(DATASET_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`No se pudo cargar compounds.json (${response.status})`);
      return response.json();
    })
    .then((data) => {
      if (import.meta.env.DEV) {
        const desynced = data.filter((compound) => compound.key !== hillKey(compound.elements));
        if (desynced.length > 0) {
          const detail = desynced
            .map((c) => `${c.formula}: key "${c.key}" ≠ hillKey "${hillKey(c.elements)}"`)
            .join('\n  ');
          throw new Error(`compounds.json tiene claves de Hill desincronizadas:\n  ${detail}`);
        }
      }

      all = data;
      byKey = new Map(all.map((compound) => [compound.key, compound]));
      byFormula = new Map(all.map((compound) => [compound.formula, compound]));

      return all;
    })
    .catch((error) => {
      loadPromise = null;
      throw error;
    });

  return loadPromise;
}

/**
 * @returns {object[]} Los 30 compuestos. Vacio antes de `loadCompounds`.
 */
export function allCompounds() {
  return all;
}

/**
 * Total de compuestos del dataset. Es el denominador del progreso de
 * descubrimientos: nunca se escribe 30 como literal en la interfaz.
 *
 * @returns {number}
 */
export function compoundCount() {
  return all.length;
}

/**
 * Resuelve /compound/:formula. Devuelve null si la formula no existe: la ruta
 * es valida, el recurso no (SPEC 01 §3).
 *
 * @param {string} formula
 * @returns {object|null}
 */
export function getCompoundByFormula(formula) {
  return byFormula.get(formula) ?? null;
}

/**
 * @param {string} key  Clave canonica de Hill
 * @returns {object|null}
 */
export function getCompoundByKey(key) {
  return byKey.get(key) ?? null;
}

/**
 * Identifica una mezcla contra el indice. Envoltorio delgado sobre
 * `chemistry.match`, que se mantiene puro y recibe el indice por parametro.
 *
 * @param {Record<string, number>} mixture
 * @returns {import('./chemistry.js').MatchResult}
 */
export function matchMixture(mixture) {
  return match(mixture, byKey);
}
