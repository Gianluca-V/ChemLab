# SPEC 12 — Descubrimientos

**Estado:** aprobado
**Depende de:** SPEC 02, SPEC 07, SPEC 08, SPEC 11
**Fuentes:** descripción §6.5, §21, §33, RF11; diseño frames 10, 17, 01
**Componentes:** `DiscoveriesView.vue`, `ProgressBar.vue`, `DiscoveryCard.vue`
**Composable:** `useDiscoveries()`

---

## 1. Qué es un descubrimiento

Descripción §6.5: *"Un compuesto se considera descubierto cuando el usuario realiza una combinación que ChemLab identifica correctamente."*

**Se registra una sola vez, la primera.** Volver a armar H₂O no genera un segundo descubrimiento ni vuelve a mostrar el banner.

| Situación | ¿Registra? |
|---|---|
| `COMBINAR` con `status: 'exact'`, primera vez | **sí** |
| `COMBINAR` con `status: 'multiple'`, primera vez | **sí** |
| `COMBINAR` con el compuesto ya descubierto | no |
| `COMBINAR` con `status: 'none'` | no |
| Abrir `/compound/:formula` desde favoritos o una sugerencia | no |

El descubrimiento se gana **combinando**, no navegando. Abrir la ficha de un compuesto desde el bloque "Probá con una de estas" del frame 11 lo muestra, pero no lo desbloquea.

### 1.1 Solo cuentan los compuestos del dataset

> **Decisión registrada.** Desde que la identificación consulta PubChem primero
> (ver el desvío en `services/compounds.js`), una mezcla puede resolver a un
> compuesto que PubChem conoce y ChemLab no. **Esos no suman al progreso.**
>
> Se evaluó abrir el conteo a todo PubChem y se descartó con evidencia: se
> probaron 20 fórmulas arbitrarias contra la API y **18 existían** —C2H6, C5H12,
> H2S, N2O, CH4O, C3H6O, CHN, C8H18…—. Dos consecuencias, las dos malas:
>
> 1. **No habría denominador.** PubChem publica del orden de 10⁸ compuestos. La
>    barra de progreso mide contra un total alcanzable; contra ese número no
>    mide nada.
> 2. **Descubrir dejaría de ser un logro.** Si casi cualquier combinación de dos
>    elementos resuelve, tirar átomos al azar siempre gana, y el mecanismo que
>    define esta misma sección se vuelve automático.
>
> En su lugar se **agrandó el dataset curado**: de 31 a 81 compuestos, cada uno
> con nombre y descripción en español escritos por el equipo y con su clave de
> Hill verificada contra PubChem. El denominador sigue siendo finito, todo sigue
> en español, y la barra sigue significando algo.
>
> Un compuesto externo sí se muestra, con su ficha de PubChem y su descripción
> en inglés atribuida, y la interfaz dice explícitamente que no suma.

`status: 'multiple'` cuenta igual que `exact`: el compuesto fue identificado, y el multiplicador no cambia cuál es (SPEC 08 §6).

---

## 2. Modelo

```json
["H2O", "ClNa", "CO2", "H3N"]
```

Array de claves canónicas de Hill, en orden de descubrimiento. La posición en el array **es** el orden; la primera es la más antigua.

> **Desvío registrado respecto de la descripción §6.5.**
>
> La descripción modela cada descubrimiento como `{ formula, discoveredAt }`. Se descarta `discoveredAt`: ninguna pantalla de los 28 frames muestra la fecha de un descubrimiento, con lo que sería un dato almacenado sin consumidor.
>
> Se aplica el mismo criterio aprobado para el historial (SPEC 11 §2): el orden alcanza, y se conserva en la posición del array.
>
> Se indexa por `key` de Hill y no por `formula`, porque `key` es lo que devuelve el motor y lo que garantiza unicidad (SPEC 02 §2.1). Para el cloruro de sodio se guarda `ClNa`, no `NaCl`.

Persiste en `chemlab_discovered` vía `useDiscoveries()`, en cada mutación.

### API

| Miembro | Tipo | Descripción |
|---|---|---|
| `items` | `computed<string[]>` | Claves descubiertas, en orden |
| `count` | `computed<number>` | Cantidad descubierta |
| `total` | `number` | 30. Sale de `compounds.json`, no está cableado |
| `has(key)` | `boolean` | Si ya fue descubierto |
| `record(key)` | `boolean` | Registra. Devuelve `true` solo si es nuevo |

`record()` devolviendo `true` es lo que dispara el banner del frame 10. La vista no decide si es nuevo: se lo pregunta al composable.

**`total` se calcula como `compounds.length`.** Si el dataset crece a 35, el contador dice `8 / 35` sin tocar código. El `30` no aparece como literal en ninguna parte.

---

## 3. Banner de descubrimiento — frame 10

Aparece en `ResultView`, solo cuando `record()` devolvió `true`:

```
🎉  ¡Nuevo compuesto descubierto!
    8 de 30 registrados
```

- Encima de la ficha del compuesto, no reemplazándola.
- `role="status"`, para que se anuncie sin robar el foco.
- No aparece al recombinar un compuesto ya descubierto: en ese caso `ResultView` muestra la ficha directamente.
- **Se registra aunque PubChem falle.** Identificar el compuesto es trabajo del motor local; el enriquecimiento externo es posterior e independiente (SPEC 08 §9, SPEC 09 §5).

---

## 4. `DiscoveriesView` — frame 17

```
┌────────────────────────────────┐
│ Descubrimientos                │
│                                │
│ Compuestos descubiertos        │
│           8 / 30               │
│ ████████████░░░░░░░░░░░░░░░░   │
│ Te faltan 22 para completar    │
│ el laboratorio.                │
│                                │
│  H₂O          NaCl             │
│  Agua         Cloruro de sodio │
│                                │
│  CO₂          NH₃              │
│  Dióxido…     Amoníaco         │
│                                │
│  ? ? ?        ? ? ?            │
│  3 átomos     9 átomos         │
└────────────────────────────────┘
```

### Progreso

- Contador `8 / 30` y barra.
- La barra es un `<progress>` nativo con `max` y `value`, o un `div` con `role="progressbar"` y `aria-valuenow`/`aria-valuemin`/`aria-valuemax`.
- El texto `Te faltan 22 para completar el laboratorio.` se calcula. Al llegar a 0 cambia a `Descubriste los N compuestos. Completaste el laboratorio.`, con `N` tomado del tamaño del dataset —nunca escrito a mano.
- **El color no es el único portador:** el número `8 / 30` acompaña siempre a la barra.

### Tarjeta descubierta

Fórmula con subíndices y nombre. Navega a `/compound/:formula`, lo que registra historial (SPEC 11 §1).

Muestra `formula`, no `key`: se ve `NaCl`, no `ClNa`.

### Tarjeta bloqueada

```
? ? ?
3 átomos
```

**La pista cuenta átomos totales**, no tipos de elemento.

> **Desambiguación del frame 17.** El diseño rotula la pista como *"la cantidad de elementos"* y muestra `3 elementos` / `2 elementos`, lo que admite dos lecturas: tipos de elemento químico o átomos. Se adopta **átomos totales** y se cambia el rótulo a `átomos`.
>
> Dos motivos:
>
> 1. **Vocabulario consistente.** El laboratorio ya cuenta átomos: el frame 08 dice `3 átomos` para H + H + O. Usar la misma palabra para la misma magnitud evita que el usuario tenga que traducir entre pantallas.
> 2. **La pista discrimina.** Contando tipos, la enorme mayoría de los compuestos diría "2 elementos" y la pista sería casi inútil. Contando átomos, el dataset se reparte en un rango mucho más amplio.

```js
const hint = Object.values(compound.elements).reduce((a, b) => a + b, 0);
```

| Compuesto | Pista |
|---|---|
| O₂ | 2 átomos |
| H₂O | 3 átomos |
| NH₃ | 4 átomos |
| CO₂ | 3 átomos |
| H₂SO₄ | 7 átomos |
| C₂H₅OH | 9 átomos |

- La tarjeta bloqueada **no es interactiva**. No navega, no recibe foco.
- No revela nombre, fórmula ni elementos. Solo el conteo.
- `aria-label`: `Compuesto sin descubrir, 3 átomos`.

### Orden de la grilla

Descubiertos primero, en orden de descubrimiento. Bloqueados después, en orden del dataset. Un descubrimiento nuevo no reordena los anteriores.

---

## 5. Estado vacío

Con 0 descubrimientos, la barra y el contador se muestran igual (`0 / 30`) y la grilla es de 30 tarjetas bloqueadas. Se agrega arriba:

```
Todavía no descubriste ningún compuesto.
Armá una mezcla en el laboratorio y tocá COMBINAR.

[ Ir al laboratorio ]
```

No se usa un estado vacío de pantalla completa: la grilla de bloqueados **es** contenido útil —muestra cuánto hay por delante y las pistas—, a diferencia de una lista de favoritos vacía, que no muestra nada.

---

## 6. El contador fuera de la vista

| Lugar | Qué muestra | Frame |
|---|---|---|
| `NavDrawer` | Badge `Descubrimientos 7/30` | 02 |
| `HomeView` | Resumen de progreso | 01 |
| `ResultView` | `8 de 30 registrados` en el banner | 10 |

Los tres leen `useDiscoveries()`, que es reactivo. Descubrir un compuesto actualiza el badge del drawer sin que ninguna vista intervenga.

> El documento de diseño anota que el Home muestra 7 mientras el frame 17 muestra 8, porque el frame 17 refleja el estado **posterior** al experimento del frame 10. No es una inconsistencia del diseño: es la misma fuente en dos momentos.

---

## 7. Sin acción destructiva

**No existe "Reiniciar descubrimientos".** Ningún frame la dibuja y no se agrega.

Favoritos e historial tienen acciones destructivas porque acumulan datos que el usuario puede querer limpiar. Los descubrimientos son progreso ganado: borrarlos no resuelve ningún problema del usuario y solo habilita perderlo por accidente.

---

## 8. Persistencia frente a actualizaciones

Descripción §33: la actualización del Service Worker **no debe eliminar** favoritos, historial, descubrimientos ni preferencias.

`chemlab_discovered` vive en `localStorage`, que es independiente de `Cache Storage`. Actualizar el App Shell no lo toca. Se detalla en SPEC 18.

### Claves desconocidas

Si el dataset cambia y `chemlab_discovered` contiene una clave que ya no existe en `compounds.json`:

- Se ignora al renderizar y al contar. `count` cuenta solo claves presentes en el dataset, para que `8 / 30` no pueda mostrar `31 / 30`.
- Se depura del array en la siguiente escritura.
