# SPEC 02 — Contratos de datos

**Estado:** aprobado
**Depende de:** SPEC 00, SPEC 01
**Fuentes:** descripción §6, §10.2, §12; diseño frames 03, 06, 08, 10, 17

---

## 1. `public/data/elements.json`

Array de 118 objetos, ordenado por `atomicNumber` ascendente.

```json
{
  "atomicNumber": 8,
  "symbol": "O",
  "name": "Oxígeno",
  "atomicMass": 15.999,
  "category": "nm",
  "group": 16,
  "period": 2,
  "block": "p",
  "electronConfiguration": "1s² 2s² 2p⁴",
  "electronegativity": 3.44,
  "meltingPoint": -218.79,
  "boilingPoint": -182.95,
  "density": 1.429,
  "oxidationStates": [-2, -1],
  "state": "gas",
  "description": "Gas incoloro e inodoro, segundo elemento más electronegativo…",
  "hazard": { "icon": "⚠️", "label": "Oxidante" },
  "glossary": "La electronegatividad 3.44 indica que el oxígeno atrae electrones con mucha fuerza: por eso forma enlaces polares y actúa como oxidante, favoreciendo la combustión de otras sustancias sin ser él mismo combustible."
}
```

### Campos

| Campo | Tipo | Nulo | Notas |
|---|---|---|---|
| `atomicNumber` | `int` 1–118 | no | Identificador numérico |
| `symbol` | `string` | no | **Clave primaria.** Único. Parámetro de la ruta `/element/:symbol` |
| `name` | `string` | no | En español |
| `atomicMass` | `float` | no | u. Para sintéticos, masa del isótopo más estable |
| `category` | `enum` | no | Ver §1.1 |
| `group` | `int` 1–18 | **sí** | `null` en lantánidos y actínidos |
| `period` | `int` 1–7 | no | |
| `block` | `s` · `p` · `d` · `f` | no | Necesario para posicionar el bloque f |
| `electronConfiguration` | `string` | no | Con superíndices Unicode |
| `electronegativity` | `float` | **sí** | Escala de Pauling. `null` en gases nobles y varios sintéticos |
| `meltingPoint` | `float` | **sí** | °C |
| `boilingPoint` | `float` | **sí** | °C |
| `density` | `float` | **sí** | g/cm³ para sólidos y líquidos, g/L para gases |
| `oxidationStates` | `int[]` | no | Array vacío si no se conocen |
| `state` | `solid` · `liquid` · `gas` | no | A 25 °C y 1 atm. Sintéticos: `solid` por predicción |
| `description` | `string` | no | 1–3 oraciones |
| `hazard` | `object` · `null` | **sí** | `{ icon, label }`. `null` si no hay advertencia |
| `glossary` | `string` · `null` | **sí** | Bloque "Qué significan estas propiedades" del frame 06 |

### Regla de valores ausentes

Un valor desconocido o no aplicable se representa **exclusivamente** con `null`. Nunca `0`, nunca `""`, nunca `"N/A"`, nunca `-1`.

Motivo, según descripción §6.1: *"Los valores que no sean aplicables o no estén disponibles deben representarse de forma explícita, sin inventar información."* Un `0` en `meltingPoint` es una afirmación falsa —hay elementos que funden a 0 °C—; `null` es la ausencia de afirmación.

La UI renderiza `null` como `—`. Nunca como `0`, `null` ni celda vacía sin marca.

### 1.1 Enum `category`

Se usan las diez claves cortas de los tokens del documento de diseño, no etiquetas largas. Permite componer el color directamente: `var(--cat-{category})`.

| Clave | Etiqueta en UI | Token de hue |
|---|---|---|
| `am` | Metales alcalinos | `--cat-am: 25` |
| `ae` | Metales alcalinotérreos | `--cat-ae: 55` |
| `tm` | Metales de transición | `--cat-tm: 95` |
| `pt` | Metales post-transición | `--cat-pt: 145` |
| `ml` | Metaloides | `--cat-ml: 185` |
| `nm` | No metales | `--cat-nm: 215` |
| `hl` | Halógenos | `--cat-hl: 250` |
| `ng` | Gases nobles | `--cat-ng: 265` |
| `ln` | Lantánidos | `--cat-ln: 330` |
| `ac` | Actínidos | `--cat-ac: 340` |

Cubre las diez categorías mínimas de la descripción §12. El mapa clave → etiqueta vive en `services/elements.js` como constante exportada; es la única fuente del texto de la leyenda.

> Los hues de `ng` (265) y `ac` (340) ya fueron desplazados en el documento de diseño respecto de sus valores naturales (300 y 10) para no colisionar con el acento violeta ni con el rojo de peligro. Se transcriben tal como están. No se los "corrige".

---

## 2. `public/data/compounds.json`

Array de **30 objetos**. El número no es arbitrario: los frames 10, 17 y el panel lateral de tablet muestran el progreso como `8 / 30`.

> **Contradicción resuelta.** La descripción §6.2 exige un mínimo de 20 compuestos y aclara que "la lista podrá ampliarse". El diseño fija 30. Se adopta 30. Los 20 de la descripción son obligatorios; los 10 restantes se eligen al construir el dataset.

```json
{
  "key": "ClNa",
  "formula": "NaCl",
  "name": "Cloruro de sodio",
  "elements": { "Na": 1, "Cl": 1 },
  "description": "Sal común. Sólido cristalino iónico, muy soluble en agua…"
}
```

### Campos

| Campo | Tipo | Notas |
|---|---|---|
| `key` | `string` | **Clave canónica en notación de Hill.** Índice del motor de combinación. Único |
| `formula` | `string` | Fórmula de presentación, en ASCII. Parámetro de `/compound/:formula` |
| `name` | `string` | En español |
| `elements` | `object` | `{ símbolo: cantidad }`. Fuente de verdad de la composición |
| `description` | `string` | Dato **interno** de ChemLab. No proviene de PubChem |

### 2.1 `key` y `formula` son campos distintos y obligatorios

No es una preferencia de modelado. Para 7 de los 20 compuestos obligatorios, la clave de Hill difiere de la fórmula convencional:

| `name` | `formula` (presentación) | `key` (Hill) |
|---|---|---|
| Agua | `H2O` | `H2O` |
| Cloruro de sodio | `NaCl` | `ClNa` |
| Hidróxido de sodio | `NaOH` | `HNaO` |
| Ácido sulfúrico | `H2SO4` | `H2O4S` |
| Carbonato de calcio | `CaCO3` | `CCaO3` |
| Amoníaco | `NH3` | `H3N` |
| Ácido clorhídrico | `HCl` | `ClH` |
| Etanol | `C2H5OH` | `C2H6O` |
| Ácido acético | `CH3COOH` | `C2H4O2` |
| Dióxido de carbono | `CO2` | `CO2` |
| Óxido de hierro(III) | `Fe2O3` | `Fe2O3` |

Con un solo campo hay que elegir entre mostrar `ClNa` al usuario o dejar al motor sin índice determinista. Con dos, cada uno hace su trabajo.

**`formula` se guarda en ASCII**, sin subíndices tipográficos. Los subíndices son presentación: el componente que renderiza una fórmula convierte los dígitos a `<sub>` al pintarla. Así la URL `#/compound/H2SO4` es escribible y el dato es comparable.

### 2.2 `key` es derivado, no autoral

`elements` es la fuente de verdad. `key` es el resultado de aplicar `hillKey()` sobre `elements` y se incluye en el archivo solo para permitir la búsqueda directa sin recalcular todas las claves en cada arranque.

Como es dato duplicado, puede desincronizarse. `services/compounds.js` valida al cargar, en desarrollo, que para toda entrada se cumpla `key === hillKey(elements)`, y falla ruidosamente si no. Un dataset inconsistente rompe el motor de forma silenciosa; es preferible que rompa temprano y fuerte.

### 2.3 Todo compuesto tiene que ser ARMABLE en el laboratorio

Regla dura, con dos condiciones que salen de los topes de SPEC 07:

| Condición | Tope |
|---|---|
| Átomos de un mismo elemento | ≤ 20 (`MAX_PER_ELEMENT`) |
| Átomos totales | ≤ 50 (`MAX_TOTAL_ATOMS`) |

**Por qué no es opcional.** El denominador del progreso es el tamaño del
dataset. Un compuesto que excede los topes suma a ese denominador y **nunca se
puede descubrir**, porque el botón "+" se deshabilita antes de llegar a su
composición. El resultado es un laboratorio que no se puede completar jamás, y
el usuario no tiene forma de saber por qué. Es estrictamente peor que no tener
ese compuesto.

El caso concreto que motivó la regla: se había incorporado la **sacarosa**,
C₁₂H₂₂O₁₁, que necesita 22 hidrógenos contra un tope de 20. Se reemplazó por el
etilenglicol. El compuesto más grande que queda es la glucosa, con 24 átomos y
un máximo de 12 de un mismo elemento: los dos topes quedan con margen.

Si alguna vez hiciera falta un compuesto que no entra, la decisión a tomar es
**subir el tope de SPEC 07**, nunca agregar el compuesto igual.

---

## 3. Notación de Hill

Regla única de ordenamiento canónico, aplicada por `services/chemistry.js`.

**Si la composición contiene carbono:**
1. `C` primero.
2. `H` segundo, si está presente.
3. El resto de los símbolos, en orden alfabético.

**Si no contiene carbono:**
1. Todos los símbolos en orden alfabético, `H` incluido en su lugar alfabético.

En ambos casos, la cantidad se anexa al símbolo y se **omite cuando es 1**.

```js
hillKey({ H: 2, O: 1 })          // → "H2O"
hillKey({ Na: 1, Cl: 1 })        // → "ClNa"
hillKey({ C: 2, H: 6, O: 1 })    // → "C2H6O"
hillKey({ C: 1, Ca: 1, O: 3 })   // → "CCaO3"
hillKey({ N: 1, H: 3 })          // → "H3N"
```

**Orden alfabético = orden por símbolo completo, sensible a mayúsculas de forma química.** Se compara símbolo contra símbolo (`Ca` vs `Cl` vs `C`), no letra por letra en ASCII crudo: en ASCII, `Cl` < `Ca` es falso pero `C` < `Ca` < `Cl` es lo correcto y es lo que produce `localeCompare` sobre los símbolos completos. El caso `CaCO3` → `CCaO3` depende de esto.

**Por qué Hill y no alfabético puro.** Es la convención química estándar (Edwin Hill, 1900), la que usan Chemical Abstracts y PubChem. Tiene nombre, es citable en la defensa y hace que la clave canónica de ChemLab coincida con la que usaría cualquier base de datos química real. El costo sobre alfabético puro son dos líneas: el caso especial de C y H.

---

## 4. Separación entre dato interno y dato externo

La descripción §6.2 lo exige: *"la información científica externa debe distinguirse de los datos internos."*

| Interno — vive en `compounds.json` | Externo — viene de PubChem |
|---|---|
| `key` | `cid` |
| `formula` | `smiles` |
| `name` | `inchiKey` |
| `elements` | `molecularMass` |
| `description` | imagen de estructura molecular |

**El dato externo nunca se escribe en `compounds.json`.** Vive en `chemlab_api_cache`, indexado por `key`, con TTL de 7 días (SPEC 09). `CompoundDetailView` y `ResultView` combinan ambas fuentes al renderizar y las presentan diferenciadas, tal como el frame 10: la descripción interna bajo el rótulo "Descripción", y `CID 962`, `SMILES`, `InChIKey` bajo la atribución "PubChem".

Consecuencias:

1. Si PubChem no responde, el compuesto sigue teniendo fórmula, nombre, composición y descripción. El frame 11 depende exactamente de esto: *"No pudimos obtener información adicional. Los datos básicos siguen disponibles."*
2. El dataset no queda con datos de terceros congelados y potencialmente desactualizados.
3. En la defensa se puede señalar sin ambigüedad qué dato es autoral y cuál es de una fuente externa.

---

## 5. Modelos persistidos

Definidos acá como contrato; sus reglas de negocio viven en las SPECs de cada sección.

### Favorito — `chemlab_favorites`

```json
{
  "id": "H2O",
  "type": "compound",
  "name": "Agua",
  "formula": "H2O",
  "rating": 4,
  "note": "El primer compuesto que armé sin ayuda de la tabla.",
  "createdAt": "2026-08-30T14:21:00.000Z",
  "updatedAt": "2026-08-30T14:21:00.000Z"
}
```

`id` es `symbol` para elementos y `formula` para compuestos. `type` desambigua: `"element"` o `"compound"`. `rating` es entero 1–5, obligatorio. `note` es string de 0–200 caracteres, opcional. Reglas completas en SPEC 10.

### Entrada de historial — `chemlab_history`

```json
{ "id": "O", "type": "element", "visitedAt": "2026-08-30T14:19:33.000Z" }
```

Reglas de deduplicación, orden y límite en SPEC 11.

### Descubrimiento — `chemlab_discovered`

```json
{ "key": "H2O", "discoveredAt": "2026-08-30T14:20:11.000Z" }
```

Indexado por `key` canónica, no por `formula`. Reglas en SPEC 12.

### Mezcla — `chemlab_mixture`

```json
{ "H": 2, "O": 1 }
```

El mismo shape que `elements` de un compuesto. Permite pasarla directo a `hillKey()` sin transformación.

---

## 6. Carga de los datasets

Ambos JSON se sirven desde `public/data/` y se piden con `fetch` en el arranque, no se importan como módulo.

Motivo: importarlos los mete en el bundle de JavaScript. `elements.json` con 118 entradas completas ronda los 60 KB; como archivo aparte lo cachea el Service Worker con estrategia Cache First (SPEC 18) y no bloquea el parseo del bundle principal.

`services/elements.js` y `services/compounds.js` cargan una sola vez, memorizan la promesa y construyen sus índices al resolver:

| Índice | Estructura | Para qué |
|---|---|---|
| `bySymbol` | `Map<string, Element>` | Resolver `/element/:symbol` en O(1) |
| `byNumber` | `Map<int, Element>` | Búsqueda por número atómico |
| `byPosition` | `Map<"period:group", Element>` | Grilla de la tabla periódica |
| `byKey` | `Map<string, Compound>` | **Matching del motor de combinación** |
| `byFormula` | `Map<string, Compound>` | Resolver `/compound/:formula` |

El motor de combinación nunca recorre el array de compuestos: normaliza la mezcla a una clave de Hill y hace un único lookup en `byKey`.
