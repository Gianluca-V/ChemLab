/**
 * Motor de combinacion — SPEC 08, notacion de Hill en SPEC 02 §3
 *
 * JavaScript plano: no importa vue, no toca el DOM, no lee ni escribe
 * localStorage, no hace fetch. Recibe objetos y devuelve objetos.
 *
 * Es la unica pieza del proyecto que se puede verificar a mano, en papel, sin
 * levantar la aplicacion.
 *
 * Que NO hace, deliberadamente (SPEC 08 §1): no simula reacciones quimicas, no
 * predice productos, no calcula termodinamica, no balancea ecuaciones y no
 * afirma que la mezcla produzca el compuesto en condiciones reales. Determina
 * si la composicion coincide con un compuesto registrado en el dataset.
 */

/**
 * Clave canonica en notacion de Hill (Edwin Hill, 1900), la misma convencion
 * que usan Chemical Abstracts y PubChem.
 *
 * Con carbono: C primero, H segundo si esta presente, el resto alfabetico.
 * Sin carbono: todos los simbolos en orden alfabetico, H en su lugar.
 * La cantidad se anexa al simbolo y se omite cuando es 1.
 *
 * El orden alfabetico compara SIMBOLOS COMPLETOS con localeCompare, no letra a
 * letra en ASCII crudo. De eso depende que C < Ca < Cl sea correcto y que
 * CaCO3 produzca CCaO3.
 *
 * @param {Record<string, number>} composition  { simbolo: cantidad }
 * @returns {string}
 */
export function hillKey(composition) {
  const symbols = Object.keys(composition).filter((symbol) => composition[symbol] > 0);
  if (symbols.length === 0) return '';

  const alphabetical = (a, b) => a.localeCompare(b, 'en');
  let ordered;

  if (symbols.includes('C')) {
    const rest = symbols.filter((s) => s !== 'C' && s !== 'H').sort(alphabetical);
    ordered = ['C', ...(symbols.includes('H') ? ['H'] : []), ...rest];
  } else {
    ordered = symbols.slice().sort(alphabetical);
  }

  return ordered
    .map((symbol) => (composition[symbol] === 1 ? symbol : `${symbol}${composition[symbol]}`))
    .join('');
}

/**
 * Maximo comun divisor de dos enteros, por el algoritmo de Euclides.
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

/**
 * MCD de un array de cantidades. Con un solo elemento, el MCD es esa cantidad.
 *
 * @param {number[]} numbers
 * @returns {number}
 */
export function gcdOf(numbers) {
  return numbers.reduce((acc, n) => gcd(acc, n), 0);
}

/**
 * @typedef {object} MatchResult
 * @property {'exact'|'multiple'|'none'} status
 * @property {object|null} compound
 * @property {number} multiplier
 * @property {string} key  Clave de Hill de la mezcla tal como fue seleccionada
 */

/**
 * Identifica la mezcla contra el indice de compuestos.
 *
 * EXACTA PRIMERO, REDUCIDA DESPUES. El orden no es negociable: es lo que
 * mantiene alcanzables a O2, H2, N2 y al peroxido. Si se redujera siempre,
 * O×2 daria la clave "O" y esas cuatro entradas del dataset quedarian
 * indescubribles, con el contador de 30 inalcanzable.
 *
 * @param {Record<string, number>} mixture
 * @param {Map<string, object>} byKey  Indice de compuestos por clave de Hill
 * @returns {MatchResult}
 */
export function match(mixture, byKey) {
  const exact = hillKey(mixture);
  const quantities = Object.values(mixture).filter((n) => n > 0);

  if (quantities.length === 0) {
    return { status: 'none', compound: null, multiplier: 0, key: '' };
  }

  const hit = byKey.get(exact);
  if (hit) return { status: 'exact', compound: hit, multiplier: 1, key: exact };

  const divisor = gcdOf(quantities);
  if (divisor > 1) {
    const reduced = {};
    for (const [symbol, n] of Object.entries(mixture)) {
      if (n > 0) reduced[symbol] = n / divisor;
    }
    const reducedHit = byKey.get(hillKey(reduced));
    if (reducedHit) {
      return { status: 'multiple', compound: reducedHit, multiplier: divisor, key: exact };
    }
  }

  return { status: 'none', compound: null, multiplier: 0, key: exact };
}

/**
 * Suma de atomos de una composicion.
 *
 * @param {Record<string, number>} composition
 * @returns {number}
 */
export function totalAtoms(composition) {
  return Object.values(composition).reduce((sum, n) => sum + n, 0);
}

/**
 * Sugerencias para una mezcla sin coincidencia — SPEC 08 §7.
 *
 * Hasta 4 compuestos, en este orden:
 *   1. Los que comparten al menos un elemento con la mezcla fallida. El usuario
 *      ya tiene ese elemento a mano.
 *   2. Solo compuestos no descubiertos: sugerir algo ya encontrado no aporta.
 *   3. Si faltan, se completa con los no descubiertos de menor cantidad total
 *      de atomos, que son los mas faciles de armar.
 *
 * Orden estable dentro de cada criterio, por `key`. No se aleatoriza: dos
 * fracasos consecutivos con la misma mezcla dan las mismas sugerencias, y una
 * sugerencia que cambia sola parece un error.
 *
 * @param {object} params
 * @param {Record<string, number>} params.mixture
 * @param {object[]} params.compounds
 * @param {Set<string>} params.discoveredKeys
 * @param {number} [params.limit]
 * @returns {object[]}
 */
export function suggest({ mixture, compounds, discoveredKeys, limit = 4 }) {
  const mixtureSymbols = new Set(Object.keys(mixture).filter((s) => mixture[s] > 0));
  const undiscovered = compounds
    .filter((compound) => !discoveredKeys.has(compound.key))
    .sort((a, b) => a.key.localeCompare(b.key, 'en'));

  const shared = undiscovered.filter((compound) =>
    Object.keys(compound.elements).some((symbol) => mixtureSymbols.has(symbol))
  );

  const bySize = undiscovered
    .filter((compound) => !shared.includes(compound))
    .sort(
      (a, b) =>
        totalAtoms(a.elements) - totalAtoms(b.elements) || a.key.localeCompare(b.key, 'en')
    );

  return [...shared, ...bySize].slice(0, limit);
}

/* ── Presentación de fórmulas ────────────────────────────────────────────────
   Los subíndices son presentación, no dato: la fórmula se guarda en ASCII para
   que la URL sea escribible y el valor comparable (SPEC 02 §2.1). Estas dos
   funciones son transformaciones de string puras, sin DOM.
   ------------------------------------------------------------------------- */

const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

/**
 * Parte una formula ASCII en tramos de texto y de subindice, para que un
 * componente los pinte con <sub> real.
 *
 * "H2SO4" → [{ text: 'H', sub: false }, { text: '2', sub: true }, ...]
 *
 * @param {string} formula
 * @returns {{text: string, sub: boolean}[]}
 */
export function formulaParts(formula) {
  return (formula.match(/\d+|\D+/g) ?? []).map((chunk) => ({
    text: chunk,
    sub: /^\d+$/.test(chunk),
  }));
}

/**
 * Version con subindices Unicode, para strings planos —el detalle de un toast,
 * un title— donde no se puede usar marcado.
 *
 * @param {string} formula
 * @returns {string}
 */
export function subscriptFormula(formula) {
  return formula.replace(/\d/g, (digit) => SUBSCRIPT_DIGITS[Number(digit)]);
}

/**
 * Enuncia la formula en palabras, para el aria-label: un lector de pantalla que
 * recibe "H2O" lee "hache dos o" (SPEC 06 §6).
 *
 * @param {string} formula
 * @returns {string}
 */
export function spokenFormula(formula) {
  return formulaParts(formula)
    .map((part) => (part.sub ? part.text : part.text.split('').join(' ')))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
