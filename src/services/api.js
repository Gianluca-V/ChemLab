/**
 * Cliente de PubChem PUG REST — SPEC 09 §3
 *
 * Unico modulo del proyecto que conoce una URL de PubChem. Ningun componente
 * construye una peticion ni ve la estructura cruda de la respuesta.
 *
 * JavaScript plano: no importa vue, no toca el DOM, no lee localStorage.
 *
 * Seguridad (SPEC 09 §6): PUG REST es publico y no requiere credenciales. Toda
 * respuesta externa es dato NO CONFIABLE: se valida la forma antes de usarla y
 * `imageUrl` se construye a partir del CID numerico validado, nunca de un
 * string arbitrario de la respuesta.
 */

const BASE = 'https://pubchem.ncbi.nlm.nih.gov';
const TIMEOUT_MS = 8000;

/** Intentos totales por compuesto: 1 automatico + manuales hasta 3 (SPEC 09 §3). */
export const MAX_ATTEMPTS = 3;

/**
 * PubChem renombro la propiedad `CanonicalSMILES` y, segun la version del
 * servicio, el nombre vigente puede ser `SMILES` o `ConnectivitySMILES`. Pedir
 * una propiedad inexistente devuelve HTTP 400, no un campo vacio.
 *
 * En vez de fijar un nombre a ciegas, se prueban en orden y se memoriza el que
 * el servicio acepta: la resolucion cuesta una sola peticion fallida por sesion
 * y sobrevive a que PubChem vuelva a renombrar la propiedad.
 */
const SMILES_PROPERTY_CANDIDATES = ['SMILES', 'ConnectivitySMILES', 'CanonicalSMILES'];
let resolvedSmilesProperty = null;

/**
 * Error de la capa de API, con su tipo clasificado — SPEC 09 §3.
 *
 * `offline` · `timeout` · `network` · `http` · `data` · `not-found`
 *
 * `not-found` se suma a la taxonomía de la SPEC: PubChem responde 404 con
 * `PUGREST.NotFound` cuando ninguna sustancia tiene esa fórmula. NO es una
 * falla: es una respuesta. Se distingue de `http` porque no habilita reintento
 * —la respuesta no va a cambiar— y porque no debe disparar el respaldo local
 * por falta de red, que es otra situación.
 */
export class ApiError extends Error {
  /**
   * @param {'offline'|'timeout'|'network'|'http'|'data'} type
   * @param {object} [options]
   * @param {number} [options.status] Codigo HTTP, solo en type 'http'
   */
  constructor(type, { status = null } = {}) {
    super(`ApiError: ${type}`);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
  }
}

/**
 * Mensaje al usuario para cada tipo de error. `timeout` y `network` se
 * distinguen aunque ambos sean fallas de red: describen situaciones distintas.
 *
 * @param {ApiError|{type: string, status?: number|null}} error
 * @returns {string}
 */
export function errorMessage(error) {
  switch (error?.type) {
    case 'offline':
      return 'Sin conexión. Los datos locales siguen disponibles.';
    case 'timeout':
      return 'La red no respondió a tiempo.';
    case 'network':
      return 'No pudimos conectarnos con la fuente de información química.';
    case 'http':
      return `PubChem respondió con un error (código ${error.status}).`;
    case 'not-found':
      return 'PubChem no tiene ninguna sustancia con esa fórmula.';
    case 'data':
    default:
      return 'La información ampliada no está disponible actualmente.';
  }
}

/**
 * Un error de red momentaneo se reintenta; sin conexion o ante un 4xx, no.
 * Reintentar sin conexion es tiempo tirado —navigator.onLine ya lo sabia— y
 * ante un 4xx la respuesta no va a cambiar.
 *
 * @param {ApiError} error
 * @returns {boolean}
 */
export function shouldAutoRetry(error) {
  return error?.type === 'timeout' || error?.type === 'network';
}

/**
 * URL de la imagen de estructura molecular.
 *
 * La imagen NO se pide con fetch: se referencia desde el src del <img> y la
 * cachea el Service Worker. Una PNG no entra en localStorage.
 *
 * @param {number} cid  CID numerico ya validado
 * @returns {string}
 */
export function structureImageUrl(cid) {
  return `${BASE}/rest/pug/compound/cid/${cid}/PNG`;
}

/**
 * Ejecuta una peticion GET con timeout de 8 s.
 *
 * El clearTimeout va en `finally`: un timer huerfano aborta una peticion
 * posterior.
 *
 * @param {string} url
 * @returns {Promise<Response>}
 */
async function get(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, { method: 'GET', signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') throw new ApiError('timeout');
    throw new ApiError('network');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Valida la forma de la respuesta y la normaliza al contrato de salida. Campos
 * ausentes se devuelven como null: no se inventan valores (SPEC 02 §1).
 *
 * La búsqueda por fórmula devuelve TODAS las sustancias con esa composición:
 * isómeros, isotopólogos e iones. Para O3 llegan Ozono, Trioxirano y el ion
 * O3-. Se descartan las filas cuya MolecularFormula no coincide exactamente
 * con lo pedido —así se van los iones— y se toma la primera de las que quedan,
 * que es la de CID más bajo y en la práctica la sustancia canónica.
 *
 * @param {unknown} payload
 * @param {string} smilesProperty
 * @param {string} [expectedFormula]
 * @returns {{cid: number, molecularMass: number|null, smiles: string|null, inchiKey: string|null, title: string|null, imageUrl: string}}
 */
function normalize(payload, smilesProperty, expectedFormula = null) {
  const rows = payload?.PropertyTable?.Properties;
  if (!Array.isArray(rows) || rows.length === 0) throw new ApiError('data');

  const exact = expectedFormula
    ? rows.filter((r) => r.MolecularFormula === expectedFormula)
    : rows;
  const row = exact[0] ?? rows[0];
  if (!row) throw new ApiError('data');

  const cid = Number(row.CID);
  if (!Number.isInteger(cid) || cid <= 0) throw new ApiError('data');

  const mass = Number(row.MolecularWeight);
  const asText = (value) => (typeof value === 'string' && value.length > 0 ? value : null);

  // PubChem no siempre devuelve la clave con el mismo nombre con el que se la
  // pidió: los alias deprecados responden 200 pero rotulan el campo con el
  // nombre vigente. Se busca el pedido primero y se cae a los otros candidatos.
  const smiles =
    [smilesProperty, ...SMILES_PROPERTY_CANDIDATES]
      .map((name) => asText(row[name]))
      .find((value) => value !== null) ?? null;

  return {
    cid,
    molecularMass: Number.isFinite(mass) ? mass : null,
    smiles,
    inchiKey: asText(row.InChIKey),
    /** Nombre en inglés que da PubChem. Es dato EXTERNO (SPEC 02 §4). */
    title: asText(row.Title),
    formula: asText(row.MolecularFormula),
    imageUrl: structureImageUrl(cid),
  };
}

/**
 * Un unico intento de identificacion contra PubChem, POR FORMULA.
 *
 * Se consulta con la clave canonica de Hill tal cual: PubChem usa la misma
 * notacion para MolecularFormula, asi que `ClNa` resuelve a Sodium Chloride sin
 * ninguna traduccion intermedia. Es lo que permite identificar composiciones
 * que no estan en compounds.json.
 *
 * La politica de reintentos vive en cache.js, que es quien conoce el estado de
 * la caché.
 *
 * @param {string} hillKey  Clave canonica de Hill de la composicion
 * @returns {Promise<{cid: number, molecularMass: number|null, smiles: string|null, inchiKey: string|null, title: string|null, formula: string|null, imageUrl: string}>}
 * @throws {ApiError}
 */
export async function fetchCompoundInfo(hillKey) {
  // Cortocircuito por navigator.onLine: sin conexion no se gasta un timeout.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError('offline');
  }

  const candidates = resolvedSmilesProperty
    ? [resolvedSmilesProperty]
    : SMILES_PROPERTY_CANDIDATES;

  let lastError = null;

  for (const smilesProperty of candidates) {
    const properties = [
      'MolecularFormula',
      'MolecularWeight',
      smilesProperty,
      'InChIKey',
      'Title',
    ].join(',');
    const url =
      `${BASE}/rest/pug/compound/fastformula/${encodeURIComponent(hillKey)}` +
      `/property/${properties}/JSON?MaxRecords=8`;

    const response = await get(url);

    // 404 con PUGREST.NotFound: PubChem no tiene esa formula. Es una respuesta,
    // no una falla, y se propaga como tal.
    if (response.status === 404) throw new ApiError('not-found');

    if (!response.ok) {
      // Un 400 con una propiedad no resuelta significa "ese nombre de propiedad
      // no existe en esta version": se prueba el siguiente candidato.
      lastError = new ApiError('http', { status: response.status });
      if (response.status === 400 && !resolvedSmilesProperty) continue;
      throw lastError;
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new ApiError('data');
    }

    resolvedSmilesProperty = smilesProperty;
    return normalize(payload, smilesProperty, hillKey);
  }

  throw lastError ?? new ApiError('data');
}
