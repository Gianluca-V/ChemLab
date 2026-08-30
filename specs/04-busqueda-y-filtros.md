# SPEC 04 — Búsqueda y filtros

**Estado:** aprobado
**Depende de:** SPEC 00, SPEC 01, SPEC 02, SPEC 03
**Fuentes:** descripción §13, §14, RF2; diseño frames 04, 19
**Componentes:** `SearchView.vue`, `SearchField.vue`, `FilterChips.vue`

---

## 1. Alcance

La búsqueda opera **exclusivamente sobre `elements.json` local**. No consulta PubChem, no consulta `compounds.json`.

Descripción §13: *"La búsqueda se realiza sobre el dataset local. No debe realizar una petición a una API por cada carácter introducido."* El frame 04 lo repite en su nota: *"PubChem se consulta solo al combinar."*

---

## 2. Campo de búsqueda

```html
<input type="search" id="q" v-model="q">
<label for="q">Nombre, símbolo o número atómico</label>
```

`type="search"` con `<label>` asociado. No placeholder como única etiqueta: un placeholder desaparece al escribir y no lo lee un lector de pantalla como nombre del control.

### Algoritmo

Un término coincide con un elemento si se cumple cualquiera de estas tres condiciones:

| Campo | Regla |
|---|---|
| `symbol` | Igualdad exacta, sin distinguir mayúsculas. `"o"` → O. `"FE"` → Fe |
| `name` | Contiene el término, **normalizado**. Ver §2.1 |
| `atomicNumber` | Igualdad exacta si el término es solo dígitos. `"8"` → O |

Orden de resultados: coincidencia exacta de símbolo primero, luego por `atomicNumber` ascendente.

`"8"` devuelve el oxígeno, no los 14 elementos cuyo número contiene un 8. Un número atómico es un identificador, no una subcadena.

### 2.1 Normalización de texto

Descripción §13: *"La búsqueda debe ser tolerante a mayúsculas/minúsculas."* Se extiende a acentos, porque los nombres están en español y nadie escribe la tilde en un buscador.

```js
const fold = (s) => s
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '');
```

Se aplica al término y al nombre antes de comparar.

| Se escribe | Coincide con |
|---|---|
| `oxi` | Oxígeno |
| `oxigeno` | Oxígeno |
| `OXÍGENO` | Oxígeno |
| `berilio` | Berilio |

Sin este paso, `"oxigeno"` no encontraría `"Oxígeno"` y el buscador quedaría inutilizable para los 22 elementos con tilde en su nombre.

### 2.2 Debounce

250 ms, según la nota del frame 04.

El debounce afecta **solo al término de texto**. Los filtros de chip y select aplican de inmediato: son un clic deliberado, no una secuencia de tecleo.

El contador de coincidencias se actualiza al resolverse el debounce, no en cada tecla. Un contador que parpadea con cada letra es ruido.

---

## 3. Los cuatro filtros

> **Contradicción #6, resuelta.** La descripción §14 propone hasta seis filtros, sumando rango de masa atómica y electronegatividad. El diseño implementa cuatro. RF2 exige un mínimo de tres. Se adoptan los cuatro del diseño: están dibujados, superan el mínimo, y los dos descartados son los que peor rinden en 390 px —un rango numérico de doble control y un filtro cuyo dato es `null` en buena parte del dataset—.

| Filtro | Control | Valores | Param |
|---|---|---|---|
| Categoría química | Chips, selección única | `all` + las 10 claves | `cat` |
| Grupo | `<select>` | `all` + 1–18 | `group` |
| Período | `<select>` | `all` + 1–7 | `period` |
| Estado a temperatura ambiente | Chips, selección única | `all` · `solid` · `liquid` · `gas` | `state` |

Los cuatro se combinan con **AND**. Los cuatro son de selección única: no hay multiselección.

### 3.1 Categoría: las 10 finas

Los chips son exactamente las diez claves de `element.category` (SPEC 02 §1.1), más "Todas".

```
Todas
● Alcalinos      ● Alcalinotérreos
● Transición     ● Post-transición
● Metaloides     ● No metales
● Halógenos      ● Gases nobles
● Lantánidos     ● Actínidos
```

Cada chip lleva una muestra del color de su hue. El filtrado es comparación directa:

```js
cat === 'all' || element.category === cat
```

> **Desvío del diseño, registrado.** El frame 04 dibuja seis chips de agrupación gruesa —Todas, Metales, No metales, Metaloides, Halógenos, Gases nobles—. Se reemplazan por las diez categorías finas.
>
> Motivo: con la agrupación gruesa, "Metales" abarca seis categorías con seis hues distintos y por lo tanto no puede tener un color propio. Eso parte el sistema en dos taxonomías —una para colorear, otra para filtrar— y obliga a una constante de mapeo que hay que mantener sincronizada con el dataset. Además vuelve inalcanzables filtros legítimos: con seis chips no hay forma de aislar lantánidos.
>
> Con las diez finas, el chip que se toca, el color de la celda y la entrada de la leyenda son el mismo objeto. El chip coloreado **es** la leyenda.
>
> Costo aceptado: once chips ocupan tres filas en 390 px en lugar de dos.

### 3.2 Grupo y período: `<select>` nativo

18 y 7 opciones respectivamente no entran como chips en mobile. El `<select>` nativo abre el selector del sistema operativo, es accesible sin trabajo adicional y no requiere JavaScript para desplegarse.

Cada uno lleva su `<label>` visible, como en el frame 04.

**Lantánidos y actínidos tienen `group: null`** (SPEC 02 §1). Quedan excluidos por cualquier filtro de grupo distinto de `all`. Es correcto: no pertenecen a ningún grupo. No se los fuerza al grupo 3.

---

## 4. Contador y acciones

Debajo de los filtros, según el frame 04:

```
14 elementos coinciden
[ Ver los 14 resultados ]      [ Limpiar ]
```

- El contador se actualiza en vivo y concuerda en número con el botón. Se pluraliza: `1 elemento coincide` / `N elementos coinciden`.
- **"Ver los N resultados"** solo hace `router.push({ name: 'results', query })` con los filtros actuales serializados. No envía nada, no consulta nada: abre `ResultsView` con lo que ya está filtrado.
- **"Limpiar"** resetea los cuatro filtros y el término a sus valores por defecto. Queda deshabilitado (`aria-disabled="true"`) cuando no hay ningún filtro activo, para no ofrecer una acción sin efecto.
- **"Ver los N resultados"** queda deshabilitado cuando N es 0.
- No hay botón de envío. No hay `<form>` con submit.

---

## 5. Estado de cero resultados

Frame 19. Se muestra en lugar del contador cuando ninguna combinación de filtros arroja elementos.

```
Ningún elemento coincide

Los tres filtros activos se excluyen entre sí:
no hay metaloides líquidos en el período 7.

[ Limpiar filtros ]
```

**El mensaje es generado, no fijo.** Enumera los filtros activos en lenguaje natural para que el usuario entienda por qué la intersección es vacía. Sin eso, el usuario concluye que la aplicación está rota.

| Filtros activos | Texto |
|---|---|
| Solo término | `Ningún elemento coincide con «xyz».` |
| Solo filtros | `Los N filtros activos se excluyen entre sí: no hay {cat} {state} en el período {p}.` |
| Ambos | `Ningún elemento coincide con «xyz» entre los {cat} {state}.` |

El bloque lleva `role="status"` para que el cambio se anuncie al resolverse el debounce.

La acción primaria es "Limpiar filtros", no "Volver". El usuario quiere seguir buscando.

---

## 6. Los chips de `TableView` — enmienda a SPEC 03

`TableView` y `SearchView` filtran con **la misma taxonomía de diez categorías**, pero se comportan distinto:

| | `SearchView` | `TableView` |
|---|---|---|
| Efecto del filtro | Reduce el conjunto de resultados | Atenúa las celdas que no coinciden |
| La grilla | no existe | conserva grupos y períodos intactos |
| Destino | `/results` | ninguno, filtra en el lugar |

Una tabla periódica que elimina celdas al filtrar deja de ser una tabla periódica: los huecos son información química. Por eso `TableView` atenúa y no quita (SPEC 03 §1).

### Enmienda

SPEC 03 §1 listaba `FilterChips` y `CategoryLegend` como dos componentes distintos dentro de `TableView`. Con la decisión de usar las diez categorías finas, ambos pasarían a mostrar **la misma lista de diez etiquetas coloreadas en la misma pantalla**. Se fusionan.

`CategoryLegend` de `TableView` deja de ser un bloque de solo lectura y pasa a contener los diez chips, que cumplen las dos funciones a la vez: explican qué significa cada color y filtran la tabla al tocarlos.

Composición corregida de `TableView`:

```
TopBar
SearchField
CategoryLegend      <details> · 10 chips coloreados · leyenda Y filtro
"Tabla periódica" + hint "deslizá →"
PeriodicTable
MixtureBar
```

- Cerrado, el `<summary>` muestra el filtro activo: `Categorías químicas` o `Categorías · Halógenos`.
- Cada chip es un `<button>` con `aria-pressed`.
- Desktop: expandido de forma permanente, como en el frame 28.

Queda derogada la lista de chips gruesos "Todos · Metales · No metales · Metaloides" del frame 03, por el mismo motivo del §3.1.

---

## 7. Rendimiento

118 elementos se filtran en memoria. No hace falta indexación ni búsqueda difusa.

- El resultado es un `computed` sobre `q` y los cuatro filtros. Vue lo recalcula solo cuando cambia una dependencia.
- Los nombres normalizados con `fold()` se precalculan **una vez** al cargar el dataset y se guardan en un campo derivado. No se normalizan 118 strings en cada tecla.
- El filtrado es un solo `Array.filter` con cinco condiciones cortocircuitadas, no cinco pasadas encadenadas.
