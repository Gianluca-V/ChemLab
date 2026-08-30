# SPEC 01 — Routing y navegación

**Estado:** aprobado
**Depende de:** SPEC 00
**Fuentes:** descripción §23, diseño frames 01–28 (drawer en 02, barra de direcciones en 28)

---

## 1. Modo de routing

Vue Router 4 en **modo hash** (`createWebHashHistory`).

Justificación: la aplicación se publica como sitio estático, sin servidor de aplicación que pueda reescribir rutas hacia `index.html`. El modo history exigiría configuración de servidor; el modo hash no depende de nada. El documento de diseño ya asume esta decisión: el frame 28 dibuja la barra de direcciones con `chemlab.app/#/lab`.

---

## 2. Tabla de rutas

| Path | `name` | Vista | Frames | RF |
|---|---|---|---|---|
| `/` | `home` | `HomeView` | 01, 25 | RF1 |
| `/table` | `table` | `TableView` | 03 | RF9 |
| `/search` | `search` | `SearchView` | 04, 19 | RF2 |
| `/results` | `results` | `ResultsView` | 05 | RF3 |
| `/element/:symbol` | `element` | `ElementDetailView` | 06 | RF4 |
| `/compound/:formula` | `compound` | `CompoundDetailView` | 10 | RF4 |
| `/lab` | `lab` | `LabView` | 07, 08 | RF9 |
| `/lab/result` | `lab-result` | `ResultView` | 09, 10, 11, 22, 26 | RF10 |
| `/favorites` | `favorites` | `FavoritesView` | 12–15, 20, 23, 24 | RF5 |
| `/history` | `history` | `HistoryView` | 16, 21 | RF6 |
| `/discoveries` | `discoveries` | `DiscoveriesView` | 17 | RF11 |
| `/contact` | `contact` | `ContactView` | 18 | RF7 |
| `/:pathMatch(.*)*` | `not-found` | `NotFoundView` | sin frame | — |

Toda navegación interna usa rutas con nombre (`router.push({ name: 'element', params: { symbol } })`), nunca strings de path armados a mano.

> **Hueco de diseño.** `NotFoundView` no tiene frame en el documento de diseño. Se implementa reutilizando el componente `EmptyState` con el encabezado y el drawer estándar, un título "Esta página no existe" y una acción primaria "Volver al inicio". No se inventa una pantalla nueva.

---

## 3. Detalle separado en dos rutas

La descripción §23 propone una ruta única `#/detail/:id`. Se descarta.

Los frames 06 y 10 no comparten ningún campo:

| `ElementDetailView` (frame 06) | `CompoundDetailView` (frame 10) |
|---|---|
| número atómico, símbolo, masa atómica | fórmula, nombre |
| categoría, grupo, período | masa molecular, CID |
| configuración electrónica | SMILES, InChIKey |
| electronegatividad | imagen de estructura molecular |
| fusión, ebullición, densidad | descripción |
| estados de oxidación | |
| **Fuente:** `elements.json` local | **Fuente:** `compounds.json` + PubChem |

Son dos contratos de datos distintos, con dos fuentes distintas y dos comportamientos de carga distintos: el elemento se resuelve de forma síncrona contra el dataset local; el compuesto requiere una consulta de red con sus estados de carga y error.

Unificarlas obligaría a una vista que ramifica todo su contenido según un parámetro. Separarlas produce dos componentes acotados y URLs autodescriptivas: `#/element/O`, `#/compound/H2O`.

**Parámetros.** El elemento se identifica por su símbolo (`O`, `Fe`, `Uue`), único entre los 118 y estable. El compuesto se identifica por su fórmula canónica en ASCII (`H2O`, `CO2`, `H2SO4`), sin subíndices tipográficos: los subíndices son presentación y se aplican al renderizar, no en la URL.

**Parámetro inválido.** Si `:symbol` no existe en el dataset o `:formula` no está en `compounds.json`, la vista muestra el estado de "no encontrado" correspondiente. No redirige a `not-found`: la ruta es válida, el recurso no existe.

---

## 4. Filtros y paginación en la query string

`/results` recibe su estado por query params:

```
/results?q=oxi&cat=nonmetal&group=16&period=2&state=gas&page=2
```

| Param | Valores | Default |
|---|---|---|
| `q` | texto libre | `""` |
| `cat` | slug de categoría química | `all` |
| `group` | `1`–`18` | `all` |
| `period` | `1`–`7` | `all` |
| `state` | `solid` · `liquid` · `gas` | `all` |
| `page` | entero ≥ 1 | `1` |

Motivos:

1. El back del navegador devuelve al usuario a la búsqueda con sus filtros intactos. Sin esto, volver desde un detalle borra el trabajo de filtrado.
2. La URL es compartible y reproducible.
3. `SearchView` y `ResultsView` no necesitan estado compartido entre ellas: la URL es el contrato.

`SearchView` (frame 04) filtra en vivo sin navegar, con debounce de 250 ms sobre el dataset local. La acción "Ver los N resultados" solo hace `router.push` a `/results` con los filtros actuales serializados. No dispara ninguna petición de red: PubChem se consulta únicamente al combinar.

---

## 5. Registro automático de historial

El acceso al detalle registra la visita. La regla vive en un **único punto**: un `router.afterEach` declarado en `src/router/index.js`.

```js
router.afterEach((to) => {
  if (to.name === 'element') {
    useHistory().record({ type: 'element', id: to.params.symbol });
  }
  if (to.name === 'compound') {
    useHistory().record({ type: 'compound', id: to.params.formula });
  }
});
```

Consecuencias de centralizarlo acá:

- Ninguna vista contiene lógica de historial. `ElementDetailView` no sabe que el historial existe.
- Se registra sin importar el origen de la navegación: desde resultados, desde favoritos, desde el propio historial o pegando la URL en la barra de direcciones.
- Es imposible que una ruta de detalle nueva se olvide de registrar.

**Qué registra y qué no.** El historial registra exclusivamente visitas a `element` y `compound`. No registra búsquedas, no registra filtros aplicados, no registra combinaciones probadas en el laboratorio y no registra la visita a `/lab/result`.

> **Contradicción resuelta.** El frame 21 del diseño describe el historial como "los elementos que visites y las combinaciones que pruebes". Se corrige: las combinaciones probadas pertenecen a Descubrimientos (SPEC 12), no al historial. El historial sigue la definición de la descripción §6.4 y RF6 — únicamente detalles visitados, de ambos tipos. La copia del estado vacío del frame 21 se ajusta en consecuencia.
>
> Un compuesto descubierto en el laboratorio entra al historial solo si el usuario navega a `/compound/:formula` para ver su detalle. Permanecer en `/lab/result` no genera entrada.

Las reglas de deduplicación, orden, límite y agrupación por día se definen en SPEC 11.

---

## 6. Navegación persistente

El encabezado y el drawer del frame 02 viven en `App.vue`, fuera del `<RouterView>`. Se montan una sola vez y persisten en todas las rutas, cumpliendo RF1 —navegación disponible desde cualquier punto—.

Entradas del drawer, en el orden del frame 02:

```
Laboratorio      → lab
Elementos        → table
Búsqueda         → search
Descubrimientos  → discoveries     badge "7/30"
Favoritos        → favorites       badge "4"
Historial        → history
Contacto         → contact
Tema             → acción, no navega
```

- Los badges se leen de `useDiscoveries()` y `useFavorites()`. Se actualizan solos al cambiar el estado, sin que la vista activa intervenga.
- El enlace de la ruta activa lleva `aria-current="page"`.
- El drawer se cierra automáticamente después de cada navegación exitosa.
- "Tema" no es un enlace: es el `ThemeToggle`, que invoca `useTheme()`.

---

## 7. Scroll

`scrollBehavior` devuelve la posición guardada cuando existe (back/forward) y `{ top: 0 }` en cualquier otro caso.

Excepción: `TableView`. El scroll de la tabla periódica es interno a su propio contenedor —el diseño lo fija en 408 px, seis filas enteras— y no debe reiniciarse al volver desde un detalle de elemento. `PeriodicTable` conserva su posición de scroll internamente.
