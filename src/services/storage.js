/**
 * Acceso al almacenamiento del navegador — SPEC 00 §5, SPEC 09 §4, SPEC 15 §7
 *
 * Unico modulo del proyecto que toca localStorage y sessionStorage. Ningun otro
 * archivo escribe un literal de clave: los nombres se declaran una sola vez,
 * aca.
 *
 * JavaScript plano: no importa vue, no usa ref ni reactive, no toca el DOM.
 *
 * El almacenamiento puede fallar por cuota o por modo privado. Toda lectura y
 * toda escritura van envueltas en try/catch: la aplicacion sigue funcionando en
 * modo degradado y `write` informa el fallo con su valor de retorno, para que
 * el llamador decida si mostrar un toast.
 */

/** Claves de localStorage: sobreviven al cierre del navegador. */
export const KEYS = Object.freeze({
  FAVORITES: 'chemlab_favorites',
  HISTORY: 'chemlab_history',
  DISCOVERED: 'chemlab_discovered',
  MIXTURE: 'chemlab_mixture',
  THEME: 'chemlab_theme',
  API_CACHE: 'chemlab_api_cache',
});

/**
 * Claves de sessionStorage: viven mientras dure la pestaña y se borran al
 * cerrarla. Se declaran aparte de KEYS porque el almacen es otro y la duracion
 * del dato tambien; usar el mismo objeto invitaria a leer una clave de sesion
 * con `read()`, que consulta localStorage, y devolver siempre el fallback.
 */
export const SESSION_KEYS = Object.freeze({
  CONTACT_MESSAGES: 'chemlab_contact_messages',
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

/*
  ── sessionStorage ──────────────────────────────────────────────────────────

  Mismo contrato que las tres funciones de arriba, contra el otro almacen.

  No es una duplicacion que convenga factorizar en un `read(store, key)`: el
  almacen que usa cada dato es una decision de diseño —¿esto tiene que
  sobrevivir al cierre de la pestaña?— y tenerlo en el nombre de la funcion la
  deja a la vista en el punto de llamada. Con un parametro, el llamador puede
  equivocarse de almacen sin que se note al leer.
*/

/**
 * Lee una clave de sesion y la parsea.
 *
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
export function readSession(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

/**
 * Escribe una clave de sesion. Devuelve false si el almacenamiento fallo.
 *
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean}
 */
export function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Elimina una clave de sesion. Devuelve false si el almacenamiento fallo.
 *
 * @param {string} key
 * @returns {boolean}
 */
export function removeSession(key) {
  try {
    sessionStorage.removeItem(key);
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
