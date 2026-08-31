/**
 * Dataset de elementos — SPEC 02 §1, §6; busqueda y filtros en SPEC 04
 *
 * JavaScript plano: no importa vue, no toca el DOM.
 *
 * El JSON se sirve desde public/data/ y se pide con fetch, no se importa como
 * modulo: importarlo lo meteria en el bundle. Como archivo aparte lo cachea el
 * Service Worker con Cache First y no bloquea el parseo del bundle principal.
 */

const DATASET_URL = `${import.meta.env.BASE_URL}data/elements.json`;

/**
 * Etiqueta completa de cada categoria — SPEC 02 §1.1.
 * Esta es la unica fuente del texto de la leyenda. No se escribe a mano en
 * ningun componente.
 */
export const CATEGORY_LABELS = Object.freeze({
  am: 'Metales alcalinos',
  ae: 'Metales alcalinotérreos',
  tm: 'Metales de transición',
  pt: 'Metales post-transición',
  ml: 'Metaloides',
  nm: 'No metales',
  hl: 'Halógenos',
  ng: 'Gases nobles',
  ln: 'Lantánidos',
  ac: 'Actínidos',
});

/** Etiqueta corta para los chips de filtro — SPEC 04 §3.1. */
export const CATEGORY_LABELS_SHORT = Object.freeze({
  am: 'Alcalinos',
  ae: 'Alcalinotérreos',
  tm: 'Transición',
  pt: 'Post-transición',
  ml: 'Metaloides',
  nm: 'No metales',
  hl: 'Halógenos',
  ng: 'Gases nobles',
  ln: 'Lantánidos',
  ac: 'Actínidos',
});

/**
 * Etiqueta en singular, para el aria-label de la celda y la linea de identidad
 * del detalle — SPEC 03 §3, SPEC 06 §2, SPEC 17 §6.
 */
export const CATEGORY_LABELS_SINGULAR = Object.freeze({
  am: 'Metal alcalino',
  ae: 'Metal alcalinotérreo',
  tm: 'Metal de transición',
  pt: 'Metal post-transición',
  ml: 'Metaloide',
  nm: 'No metal',
  hl: 'Halógeno',
  ng: 'Gas noble',
  ln: 'Lantánido',
  ac: 'Actínido',
});

export const CATEGORY_KEYS = Object.freeze(Object.keys(CATEGORY_LABELS));

/** Estado a 25 °C y 1 atm. */
export const STATE_LABELS = Object.freeze({
  solid: 'Sólido',
  liquid: 'Líquido',
  gas: 'Gas',
});

/** Forma adjetiva plural, para el mensaje generado de cero resultados. */
const STATE_ADJECTIVES = Object.freeze({
  solid: 'sólidos',
  liquid: 'líquidos',
  gas: 'gaseosos',
});

export const STATE_KEYS = Object.freeze(Object.keys(STATE_LABELS));

/**
 * Normaliza texto para comparar: minusculas y sin acentos.
 *
 * Los nombres estan en espanol y nadie escribe la tilde en un buscador. Sin
 * este paso, "oxigeno" no encontraria "Oxigeno" y el buscador quedaria
 * inutilizable para los 22 elementos con tilde en su nombre.
 *
 * @param {string} value
 * @returns {string}
 */
export function fold(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

let loadPromise = null;
let all = [];
let bySymbol = new Map();
let byNumber = new Map();
let byPosition = new Map();

/**
 * Carga el dataset una sola vez, memoriza la promesa y construye los indices al
 * resolver. Llamarla dos veces no dispara dos peticiones.
 *
 * Cada elemento recibe un campo derivado `foldedName`, precalculado aca: no se
 * normalizan 118 strings en cada tecla (SPEC 04 §7).
 *
 * @returns {Promise<object[]>}
 */
export function loadElements() {
  if (loadPromise) return loadPromise;

  loadPromise = fetch(DATASET_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`No se pudo cargar elements.json (${response.status})`);
      return response.json();
    })
    .then((data) => {
      all = data.map((element) => ({ ...element, foldedName: fold(element.name) }));

      bySymbol = new Map(all.map((e) => [e.symbol, e]));
      byNumber = new Map(all.map((e) => [e.atomicNumber, e]));
      byPosition = new Map(
        all.filter((e) => e.group !== null).map((e) => [`${e.period}:${e.group}`, e])
      );

      return all;
    })
    .catch((error) => {
      loadPromise = null; // permite reintentar la carga
      throw error;
    });

  return loadPromise;
}

/**
 * Los 118 elementos, ordenados por numero atomico. Vacio antes de `loadElements`.
 * @returns {object[]}
 */
export function allElements() {
  return all;
}

/**
 * Resuelve /element/:symbol en O(1). Devuelve null si el simbolo no existe: la
 * ruta es valida, el recurso no (SPEC 01 §3).
 *
 * @param {string} symbol
 * @returns {object|null}
 */
export function getElement(symbol) {
  return bySymbol.get(symbol) ?? null;
}

/**
 * @param {number} atomicNumber
 * @returns {object|null}
 */
export function getElementByNumber(atomicNumber) {
  return byNumber.get(atomicNumber) ?? null;
}

/**
 * @param {number} period
 * @param {number} group
 * @returns {object|null}
 */
export function getElementAt(period, group) {
  return byPosition.get(`${period}:${group}`) ?? null;
}

/**
 * @typedef {object} Criteria
 * @property {string} [q]       Texto libre
 * @property {string} [cat]     Clave de categoria o 'all'
 * @property {string} [group]   '1'–'18' o 'all'
 * @property {string} [period]  '1'–'7' o 'all'
 * @property {string} [state]   'solid' | 'liquid' | 'gas' | 'all'
 */

/** Valores por defecto de los cuatro filtros y del termino — SPEC 01 §4. */
export const DEFAULT_CRITERIA = Object.freeze({
  q: '',
  cat: 'all',
  group: 'all',
  period: 'all',
  state: 'all',
});

/**
 * Sanea criterios llegados de la query string. Un valor desconocido se ignora,
 * es decir, cae al default (SPEC 05 §2).
 *
 * @param {Record<string, unknown>} raw
 * @returns {Required<Criteria>}
 */
export function normalizeCriteria(raw = {}) {
  const asText = (value) => (typeof value === 'string' ? value : '');
  const group = Number(raw.group);
  const period = Number(raw.period);

  return {
    q: asText(raw.q).trim(),
    cat: CATEGORY_KEYS.includes(raw.cat) ? raw.cat : 'all',
    group: Number.isInteger(group) && group >= 1 && group <= 18 ? String(group) : 'all',
    period: Number.isInteger(period) && period >= 1 && period <= 7 ? String(period) : 'all',
    state: STATE_KEYS.includes(raw.state) ? raw.state : 'all',
  };
}

/**
 * @param {Required<Criteria>} criteria
 * @returns {boolean} true si algun filtro o el termino estan activos
 */
export function hasActiveCriteria(criteria) {
  return (
    criteria.q !== '' ||
    criteria.cat !== 'all' ||
    criteria.group !== 'all' ||
    criteria.period !== 'all' ||
    criteria.state !== 'all'
  );
}

/**
 * Serializa criterios a query string, omitiendo los que estan en su default:
 * la URL queda corta y legible.
 *
 * @param {Required<Criteria>} criteria
 * @param {number} [page]
 * @returns {Record<string, string>}
 */
export function toQuery(criteria, page) {
  const query = {};
  for (const [key, value] of Object.entries(criteria)) {
    if (value !== DEFAULT_CRITERIA[key]) query[key] = value;
  }
  if (page && page > 1) query.page = String(page);
  return query;
}

/**
 * Un termino coincide si se cumple cualquiera de las tres condiciones de
 * SPEC 04 §2:
 *
 *   symbol        igualdad exacta, sin distinguir mayusculas
 *   name          contiene el termino, normalizado
 *   atomicNumber  igualdad exacta si el termino es solo digitos
 *
 * "8" devuelve el oxigeno, no los 14 elementos cuyo numero contiene un 8: un
 * numero atomico es un identificador, no una subcadena.
 *
 * @param {object} element
 * @param {string} foldedTerm
 * @returns {boolean}
 */
function matchesTerm(element, foldedTerm) {
  if (foldedTerm === '') return true;
  if (element.symbol.toLowerCase() === foldedTerm) return true;
  if (/^\d+$/.test(foldedTerm)) return element.atomicNumber === Number(foldedTerm);
  return element.foldedName.includes(foldedTerm);
}

/**
 * Aplica el termino y los cuatro filtros. Los cinco se combinan con AND, en un
 * solo Array.filter con condiciones cortocircuitadas (SPEC 04 §7).
 *
 * Orden: coincidencia exacta de simbolo primero, luego por numero atomico.
 *
 * @param {Criteria} criteria
 * @returns {object[]}
 */
export function searchElements(criteria) {
  const { q, cat, group, period, state } = { ...DEFAULT_CRITERIA, ...criteria };
  const term = fold(q.trim());

  const results = all.filter(
    (element) =>
      (cat === 'all' || element.category === cat) &&
      (group === 'all' || element.group === Number(group)) &&
      (period === 'all' || element.period === Number(period)) &&
      (state === 'all' || element.state === state) &&
      matchesTerm(element, term)
  );

  if (term === '') return results;

  return results.sort((a, b) => {
    const aExact = a.symbol.toLowerCase() === term ? 0 : 1;
    const bExact = b.symbol.toLowerCase() === term ? 0 : 1;
    return aExact - bExact || a.atomicNumber - b.atomicNumber;
  });
}

/**
 * Descripcion en lenguaje natural de los filtros activos, para el estado de
 * cero resultados — SPEC 04 §5.
 *
 * El mensaje es generado, no fijo: enumera los filtros activos para que el
 * usuario entienda por que la interseccion es vacia. Sin eso, concluye que la
 * aplicacion esta rota.
 *
 * Vive aca y no en un componente porque depende del mapa unico de etiquetas de
 * categoria, que esta SPEC 02 §1.1 declara como fuente unica.
 *
 * @param {Required<Criteria>} criteria
 * @returns {string}
 */
export function describeEmptyResult(criteria) {
  const filters = [];
  if (criteria.cat !== 'all') filters.push(CATEGORY_LABELS[criteria.cat].toLowerCase());
  if (criteria.state !== 'all') filters.push(STATE_ADJECTIVES[criteria.state]);
  if (criteria.group !== 'all') filters.push(`del grupo ${criteria.group}`);
  if (criteria.period !== 'all') filters.push(`en el período ${criteria.period}`);

  const hasTerm = criteria.q !== '';

  if (hasTerm && filters.length === 0) {
    return `Ningún elemento coincide con «${criteria.q}».`;
  }
  if (hasTerm) {
    return `Ningún elemento coincide con «${criteria.q}» entre los ${filters.join(' ')}.`;
  }

  const count = filters.length;
  const plural = count === 1 ? 'El filtro activo deja' : `Los ${count} filtros activos se excluyen entre sí:`;
  return count === 1
    ? `${plural} el conjunto vacío: no hay elementos ${filters.join(' ')}.`
    : `${plural} no hay ${filters.join(' ')}.`;
}
