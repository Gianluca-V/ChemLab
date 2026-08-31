/**
 * Dataset de compuestos — SPEC 02 §2, §6; matching en SPEC 08
 *
 * JavaScript plano: no importa vue, no toca el DOM.
 *
 * El motor de combinacion nunca recorre el array: normaliza la mezcla a una
 * clave de Hill y hace un unico lookup en `byKey`.
 */

import { gcdOf, hillKey, match } from './chemistry.js';
import { resolveCompoundInfo } from './cache.js';

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
 * @returns {object[]} Todo el dataset. Vacio antes de `loadCompounds`.
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

/**
 * @typedef {object} Identification
 * @property {'exact'|'multiple'|'none'} status
 * @property {'pubchem'|'cache'|'local'|null} source  De dónde salió la identidad
 * @property {object|null} compound   { key, formula, name, description, inDataset }
 * @property {object|null} external   Contrato de api.js, o null
 * @property {number} multiplier
 * @property {string} key             Clave de Hill de la mezcla tal como se armó
 * @property {import('./api.js').ApiError|null} error
 */

/**
 * Construye la identidad de un compuesto combinando las dos fuentes, con la
 * separación que exige SPEC 02 §4.
 *
 * El nombre y la descripción en español son dato INTERNO y ganan siempre que
 * el compuesto esté en compounds.json. Para una composición que PubChem conoce
 * y nosotros no, el nombre es el `Title` en inglés que devuelve la API, y no
 * hay descripción: no se inventa una.
 *
 * @param {string} key
 * @param {object|null} external
 * @returns {object|null}
 */
function buildIdentity(key, external) {
  const local = byKey.get(key);
  if (local) {
    return {
      key: local.key,
      formula: local.formula,
      name: local.name,
      description: local.description,
      inDataset: true,
    };
  }
  if (external && external.title) {
    return {
      key,
      formula: external.formula ?? key,
      name: external.title,
      description: null,
      inDataset: false,
    };
  }
  return null;
}

/**
 * Identifica una mezcla consultando PRIMERO a PubChem y cayendo al dataset
 * local o a la caché cuando la red no está disponible.
 *
 * > Desvío registrado respecto de SPEC 08 §1, §9 y SPEC 09 §1, por decisión del
 * > equipo. Las SPECs fijaban que el motor identifica exclusivamente contra
 * > compounds.json y que PubChem se consulta SOLO después, para enriquecer un
 * > compuesto ya identificado. Se invierte: PubChem es ahora la fuente primaria
 * > de identidad y el dataset local es el respaldo.
 * >
 * > Lo que se gana: composiciones reales que no están entre nuestras 31
 * > entradas —el caso que disparó el cambio fue el ozono— dejan de reportarse
 * > como inexistentes.
 * >
 * > Lo que se paga, y hay que tenerlo presente en la defensa:
 * >   · Cada COMBINAR toca la red, también cuando la mezcla no da nada. Antes
 * >     una combinación sin coincidencia se resolvía en memoria.
 * >   · El resultado deja de ser determinista sin conexión: la misma mezcla
 * >     puede identificarse o no según la red y el estado de la caché.
 * >   · La pantalla de resultado gana un estado de carga para la IDENTIFICACIÓN
 * >     misma, no solo para el enriquecimiento (SPEC 09 §5).
 * >
 * > Lo que NO cambia: la normalización de Hill sigue siendo local, pura y
 * > verificable en papel; el progreso de descubrimientos sigue contando solo
 * > compuestos del dataset, porque su denominador es el tamaño del dataset.
 *
 * Igual que el matching local, se prueba la clave EXACTA primero y la reducida
 * por MCD después: es lo que mantiene alcanzables a O2, O3, H2 y N2.
 *
 * @param {Record<string, number>} mixture
 * @param {object} [options]
 * @param {number} [options.attemptsUsed]
 * @param {boolean} [options.skipCache]
 * @returns {Promise<Identification>}
 */
export async function identifyMixture(mixture, options = {}) {
  const quantities = Object.values(mixture).filter((n) => n > 0);
  const exactKey = hillKey(mixture);

  if (quantities.length === 0) {
    return { status: 'none', source: null, compound: null, external: null, multiplier: 0, key: '', error: null };
  }

  /** @type {{key: string, multiplier: number}[]} */
  const candidates = [{ key: exactKey, multiplier: 1 }];

  const divisor = gcdOf(quantities);
  if (divisor > 1) {
    const reduced = {};
    for (const [symbol, n] of Object.entries(mixture)) {
      if (n > 0) reduced[symbol] = n / divisor;
    }
    candidates.push({ key: hillKey(reduced), multiplier: divisor });
  }

  let lastError = null;

  for (const candidate of candidates) {
    const remote = await resolveCompoundInfo(candidate.key, options);
    if (remote.error) lastError = remote.error;
    if (!remote.data) continue;

    const identity = buildIdentity(candidate.key, remote.data);
    if (!identity) continue;

    return {
      status: candidate.multiplier === 1 ? 'exact' : 'multiple',
      source: remote.fromCache ? 'cache' : 'pubchem',
      compound: identity,
      external: remote.data,
      multiplier: candidate.multiplier,
      key: exactKey,
      error: remote.status === 'stale' ? remote.error : null,
    };
  }

  /*
    Respaldo: el motor local de SPEC 08 §5, sin tocar. Se delega en él en vez de
    repetir acá la regla de exacta-primero-reducida-después, para que exista UNA
    sola implementación de esa regla —la pura, la que se verifica en papel— y no
    dos que puedan divergir.
  */
  const local = matchMixture(mixture);
  if (local.compound) {
    return {
      status: local.status,
      source: 'local',
      compound: buildIdentity(local.compound.key, null),
      external: null,
      multiplier: local.multiplier,
      key: exactKey,
      error: lastError,
    };
  }

  return {
    status: 'none',
    source: null,
    compound: null,
    external: null,
    multiplier: 0,
    key: exactKey,
    error: lastError,
  };
}
