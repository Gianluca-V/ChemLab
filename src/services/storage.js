/**
 * Acceso a localStorage — SPEC 00 §5, SPEC 09 §4, SPEC 15 §7
 *
 * Unico modulo del proyecto que toca localStorage. Ningun otro archivo escribe
 * un literal de clave: los seis nombres se declaran una sola vez, aca.
 *
 * JavaScript plano: no importa vue, no usa ref ni reactive, no toca el DOM.
 *
 * localStorage puede fallar por cuota o por modo privado. Toda lectura y toda
 * escritura van envueltas en try/catch: la aplicacion sigue funcionando en modo
 * degradado y `write` informa el fallo con su valor de retorno, para que el
 * llamador decida si mostrar un toast.
 */

export const KEYS = Object.freeze({
  FAVORITES: 'chemlab_favorites',
  HISTORY: 'chemlab_history',
  DISCOVERED: 'chemlab_discovered',
  MIXTURE: 'chemlab_mixture',
  THEME: 'chemlab_theme',
  API_CACHE: 'chemlab_api_cache',
});

/**
 * Lee una clave y la parsea. Ante cualquier fallo —almacenamiento no
 * disponible, JSON corrupto— devuelve el valor por defecto: partir de estado
 * vacio es preferible a romper el arranque.
 *
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

/**
 * Escribe una clave. Devuelve false si el almacenamiento fallo, sin lanzar.
 *
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean} true si se persistio
 */
export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Elimina una clave. Devuelve false si el almacenamiento fallo.
 *
 * @param {string} key
 * @returns {boolean}
 */
export function remove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Indica si el almacenamiento esta disponible para escritura. Se usa al
 * arrancar para decidir si avisar del modo degradado.
 *
 * @returns {boolean}
 */
export function isAvailable() {
  const probe = '__chemlab_probe__';
  try {
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
