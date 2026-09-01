/**
 * Cache de respuestas de PubChem — SPEC 09 §4
 *
 * JavaScript plano: no importa vue, no toca el DOM. Se apoya en storage.js
 * para todo acceso a localStorage.
 *
 * Indexada por la clave canonica de Hill, la misma con la que el motor
 * identifica el compuesto. TTL de 7 dias, LRU de 60 entradas.
 */

import { KEYS, read, write } from './storage.js';
import { ApiError, fetchCompoundInfo, shouldAutoRetry } from './api.js';

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Maximo de entradas.
 *
 * Tiene que superar al dataset: con un tope por debajo de los 81 compuestos,
 * recorrer el laboratorio desaloja entradas que se van a volver a pedir, y la
 * cache pasa a trabajar en contra. 120 deja margen para los compuestos que solo
 * conoce PubChem sin crecer sin techo.
 *
 * Cada entrada ronda 1 KB desde que guarda tambien la descripcion externa, con
 * un tope de 600 caracteres: 120 entradas son ~120 KB contra los ~5 MB de
 * localStorage, asi que sigue sin hacer falta IndexedDB.
 */
const MAX_ENTRIES = 120;

/**
 * Peticiones en vuelo, por clave. Si dos componentes piden el mismo compuesto a
 * la vez —el panel lateral y la vista principal— comparten la misma promesa en
 * lugar de disparar dos peticiones.
 * @type {Map<string, Promise<object>>}
 */
const inFlight = new Map();

/** @returns {Record<string, {data: object, storedAt: number, lastAccess: number}>} */
function readAll() {
  const stored = read(KEYS.API_CACHE, {});
  return stored && typeof stored === 'object' ? stored : {};
}

/**
 * Persiste la caché. Si la escritura falla —cuota, modo privado— se descarta en
 * silencio: la caché es una optimizacion, no un requisito de funcionamiento.
 *
 * @param {Record<string, object>} entries
 */
function writeAll(entries) {
  write(KEYS.API_CACHE, entries);
}

/**
 * @param {number} storedAt
 * @returns {boolean}
 */
function isExpired(storedAt) {
  return Date.now() - storedAt > TTL_MS;
}

/**
 * Lee una entrada y refresca su `lastAccess`. Una entrada vencida NO se borra:
 * se devuelve marcada como vencida para poder servirla si el refresco falla.
 *
 * @param {string} key
 * @returns {{data: object, storedAt: number, expired: boolean}|null}
 */
export function peek(key) {
  const entries = readAll();
  const entry = entries[key];
  if (!entry || typeof entry.storedAt !== 'number') return null;

  entry.lastAccess = Date.now();
  writeAll(entries);

  return { data: entry.data, storedAt: entry.storedAt, expired: isExpired(entry.storedAt) };
}

/**
 * Indice de imagenes de estructura ya cacheadas, por clave de Hill.
 *
 * A diferencia de `peek()`, NO refresca `lastAccess` ni escribe: una lista de
 * hasta 100 filas que llamara a `peek()` por fila reescribiria la cache entera
 * una vez por fila. Aca solo se lee.
 *
 * Sirve para pintar la miniatura de un compuesto que el usuario ya visito, sin
 * pedir nada a la red. Lo que no este cacheado no aparece: la lista cae a su
 * miniatura local en lugar de disparar 100 peticiones.
 *
 * @returns {Map<string, string>} clave de Hill → URL de la imagen
 */
export function cachedImages() {
  const entries = readAll();
  const index = new Map();

  for (const [key, entry] of Object.entries(entries)) {
    const url = entry?.data?.imageUrl;
    if (typeof url === 'string' && url.length > 0) index.set(key, url);
  }

  return index;
}

/**
 * Guarda una entrada, expulsando la de `lastAccess` mas antiguo cuando se llega
 * al limite. LRU simple.
 *
 * @param {string} key
 * @param {object} data
 */
export function put(key, data) {
  const entries = readAll();
  const now = Date.now();
  entries[key] = { data, storedAt: now, lastAccess: now };

  const keys = Object.keys(entries);
  if (keys.length > MAX_ENTRIES) {
    const surplus = keys.length - MAX_ENTRIES;
    keys
      .sort((a, b) => (entries[a].lastAccess ?? 0) - (entries[b].lastAccess ?? 0))
      .slice(0, surplus)
      .forEach((oldest) => delete entries[oldest]);
  }

  writeAll(entries);
}

/** Vacia la caché por completo. */
export function clear() {
  writeAll({});
}

/**
 * @typedef {object} CompoundInfoResult
 * @property {'ok'|'stale'|'error'} status
 * @property {object|null} data          Contrato de api.js, o null en 'error'
 * @property {number|null} storedAt      Momento de guardado, para "Informacion del {fecha}"
 * @property {boolean} fromCache         true si no hubo peticion de red
 * @property {ApiError|null} error
 * @property {number} attemptsUsed       Intentos consumidos, acumulados
 */

/**
 * Resuelve la informacion externa de una clave de Hill implementando el
 * diagrama de flujo de SPEC 09 §4:
 *
 *   ¿en caché y vigente?  → usar caché, sin pantalla de loading
 *   ¿sin conexion?        → servir caché vencida avisando la fecha, o error
 *   consultar PubChem     → ok: guardar y mostrar
 *                           error: servir caché vencida, o mostrar el error
 *                                  con los datos locales intactos
 *
 * Un dato de ocho dias es mejor que ninguno.
 *
 * Reintentos: el primer intento se reintenta UNA vez de forma automatica e
 * inmediata ante `timeout` o `network`. Cubre el corte de red momentaneo, que
 * es el caso mas comun, sin cobrarle un toque al usuario, y deja la peor espera
 * en 16 segundos y no en 24. Los reintentos siguientes son manuales.
 *
 * @param {string} key                     Clave canonica de Hill
 * @param {object} [options]
 * @param {number} [options.attemptsUsed]  Intentos ya consumidos en esta pantalla
 * @param {boolean} [options.skipCache]    Fuerza la consulta de red (boton Reintentar)
 * @returns {Promise<CompoundInfoResult>}
 */
export async function resolveCompoundInfo(key, { attemptsUsed = 0, skipCache = false } = {}) {
  const cached = peek(key);

  if (!skipCache && cached && !cached.expired) {
    return {
      status: 'ok',
      data: cached.data,
      storedAt: cached.storedAt,
      fromCache: true,
      error: null,
      attemptsUsed,
    };
  }

  const serveStale = (error) =>
    cached
      ? {
          status: 'stale',
          data: cached.data,
          storedAt: cached.storedAt,
          fromCache: true,
          error,
          attemptsUsed,
        }
      : { status: 'error', data: null, storedAt: null, fromCache: false, error, attemptsUsed };

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return serveStale(new ApiError('offline'));
  }

  const isFirstEntry = attemptsUsed === 0;
  let attempts = attemptsUsed;
  let lastError = null;

  // Primer intento + un unico reintento automatico ante fallo de red.
  const maxThisCall = isFirstEntry ? 2 : 1;

  for (let i = 0; i < maxThisCall; i += 1) {
    attempts += 1;
    try {
      const request = inFlight.get(key) ?? fetchCompoundInfo(key);
      inFlight.set(key, request);

      const data = await request.finally(() => inFlight.delete(key));

      put(key, data);
      return {
        status: 'ok',
        data,
        storedAt: Date.now(),
        fromCache: false,
        error: null,
        attemptsUsed: attempts,
      };
    } catch (error) {
      lastError = error instanceof ApiError ? error : new ApiError('data');
      // `not-found` es una respuesta, no una falla: PubChem contesto que no
      // tiene esa formula. No se reintenta y no se sirve caché vencida.
      if (lastError.type === 'not-found') {
        return {
          status: 'error',
          data: null,
          storedAt: null,
          fromCache: false,
          error: lastError,
          attemptsUsed: attempts,
        };
      }
      if (!shouldAutoRetry(lastError)) break;
    }
  }

  return { ...serveStale(lastError), attemptsUsed: attempts };
}
