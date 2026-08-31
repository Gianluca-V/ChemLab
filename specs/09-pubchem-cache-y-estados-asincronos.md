# SPEC 09 — PubChem, caché y estados asíncronos

**Estado:** aprobado
**Depende de:** SPEC 02, SPEC 06, SPEC 08
**Fuentes:** descripción §8, §9, §26, §34, §36, RF12; diseño frames 09, 10, 11, 22
**Módulos:** `src/services/api.js`, `src/services/cache.js`

---

## 1. Cuándo se consulta PubChem

**Solo después de que el motor identificó un compuesto.** En ningún otro momento.

| Acción | ¿Consulta PubChem? |
|---|---|
| Escribir en el buscador | no |
| Aplicar filtros | no |
| Abrir el detalle de un elemento | no |
| Recorrer la tabla periódica | no |
| Agregar elementos a la mezcla | no |
| COMBINAR con coincidencia | **sí** |
| COMBINAR sin coincidencia | no |
| Abrir `/compound/:formula` | **sí** |

Descripción §13 y nota del frame 04: *"PubChem se consulta solo al combinar."* Sin compuesto identificado no hay nada que enriquecer.

---

## 2. Enmienda a SPEC 02 — campo `query`

> **Desvío registrado, por decisión del equipo. Esta sección quedó sin efecto.**
>
> El campo `query` existía porque la identificación consultaba PubChem por
> nombre (`/compound/name/{query}`), y `name` está en español. Al invertirse la
> identificación —PubChem primero, dataset como respaldo, ver el desvío
> registrado en `services/compounds.js`— la consulta pasó a hacerse por
> fórmula contra `/compound/fastformula/{key}`, que no necesita ningún término
> en inglés: la clave de Hill ya es el parámetro de búsqueda.
>
> El campo quedó sin un solo lector en `src/`. Se eliminó de las 31 entradas de
> `compounds.json`. **Lo que cuesta:** si alguna vez hiciera falta volver a
> buscar por nombre —por ejemplo para un compuesto cuya fórmula sea ambigua—
> hay que reponer el campo. Se prefirió eso a mantener en el dataset un dato
> que ningún código lee y que sugiere un mecanismo que ya no existe.
>
> El resto de la sección se conserva como registro de por qué el campo existió.

`compounds.json` incorporaba un campo:

```json
{
  "key": "ClNa",
  "formula": "NaCl",
  "name": "Cloruro de sodio",
  "query": "sodium chloride",
  "elements": { "Na": 1, "Cl": 1 },
  "description": "Sal común. Sólido cristalino iónico…"
}
```

`query` es el término con el que se busca el compuesto en PubChem. Es necesario porque `name` está en español y PubChem no resuelve "Agua" ni "Cloruro de sodio".

**No rompe la separación de la descripción §6.2.** `query` es un parámetro de búsqueda que redactamos nosotros, del mismo orden que una URL; no es un dato científico copiado de una fuente externa. El dato externo sigue siendo exclusivamente lo que la respuesta trae: `cid`, `smiles`, `inchiKey`, `molecularMass` e imagen.

---

## 3. `api.js`

Encapsula toda la comunicación con PubChem. Descripción §8.1: *"No debe existir lógica específica de PubChem repartida por los componentes de interfaz."* Ningún componente conoce una URL de PubChem.

### Endpoints

```
Propiedades
GET /rest/pug/compound/name/{query}/property/
    MolecularFormula,MolecularWeight,SMILES,InChIKey/JSON

Imagen de estructura
GET /rest/pug/compound/cid/{cid}/PNG
```

Base: `https://pubchem.ncbi.nlm.nih.gov`

> **A verificar contra la API en vivo antes de implementar.** PubChem renombró la propiedad `CanonicalSMILES`; según la versión del servicio, el nombre vigente puede ser `SMILES` o `ConnectivitySMILES`. Se confirma con una petición de prueba y se fija el valor definitivo en `api.js`. Pedir una propiedad inexistente devuelve HTTP 400, no un campo vacío.

La imagen **no se pide con `fetch`**: se referencia desde el `src` del `<img>` y la cachea el Service Worker (SPEC 18). Una PNG no entra en `localStorage`.

### Contrato de salida

`api.js` devuelve siempre la misma forma, normalizada. Los componentes nunca ven la estructura cruda de PubChem:

```js
{ cid, molecularMass, smiles, inchiKey, imageUrl }
```

Campos ausentes en la respuesta se devuelven como `null`, siguiendo la regla de SPEC 02 §1. No se inventan valores.

### Los diez puntos de la descripción §8.2

| # | Requisito | Resolución |
|---|---|---|
| 1 | URL válida | Construida con `encodeURIComponent` sobre `query` |
| 2 | Método HTTP | `GET` explícito |
| 3 | Respuesta HTTP | Se verifica `res.ok` antes de parsear |
| 4 | Parseo JSON | `await res.json()` dentro de `try/catch` propio |
| 5 | Errores HTTP | Clasificados como `http`, con el código |
| 6 | Errores de red | `TypeError` de `fetch` → `network` |
| 7 | Respuestas incompletas | Validación de forma antes de devolver → `data` |
| 8 | Timeout | `AbortController`, 8 000 ms |
| 9 | Offline | Cortocircuito por `navigator.onLine` |
| 10 | Caché | `cache.js`, delante de toda petición |

### Timeout

```js
const ctrl = new AbortController();
const t = setTimeout(() => ctrl.abort(), 8000);
```

8 segundos, según el frame 22. El `clearTimeout` va en `finally`: un timer huérfano aborta una petición posterior.

### Taxonomía de errores

Descripción §36 exige diferenciarlos. `api.js` devuelve un error con `type`:

| `type` | Causa | Mensaje al usuario |
|---|---|---|
| `offline` | `navigator.onLine === false` | `Sin conexión. Los datos locales siguen disponibles.` |
| `timeout` | `AbortError` a los 8 s | `La red no respondió a tiempo.` |
| `network` | `TypeError` de `fetch` | `No pudimos conectarnos con la fuente de información química.` |
| `http` | `res.ok === false` | `PubChem respondió con un error (código {status}).` |
| `data` | JSON válido, forma inesperada | `La información ampliada no está disponible actualmente.` |

`timeout` y `network` se distinguen aunque ambos sean fallas de red: el frame 22 muestra específicamente `timeout tras 8 s`, y "no respondió a tiempo" y "no pudimos conectarnos" describen situaciones distintas para el usuario.

### Reintentos

**Uno automático, inmediato. Después, manuales, hasta 3 en total.**

```
t=0s    intento 1
t=8s    timeout → reintento automático, sin pedir nada
t=16s   timeout → se muestra el error del frame 22
                  "timeout tras 8 s · intento 2 de 3"
        [ Reintentar ] → intento 3
        agotado el 3, el botón queda deshabilitado
        hasta salir de la pantalla
```

- El reintento automático cubre el corte de red momentáneo, que es el caso más común, sin cobrarle un toque al usuario.
- La peor espera antes de ver algo es de 16 segundos, no de 24.
- **`offline` y `http` no reintentan automáticamente.** Sin conexión, reintentar es tiempo tirado —`navigator.onLine` ya lo sabía—; ante un 4xx, la respuesta no va a cambiar. Se muestra el error de inmediato y "Reintentar" queda disponible por si la situación cambió.
- El contador se reinicia al cambiar de compuesto o de pantalla.

---

## 4. `cache.js`

Clave `chemlab_api_cache` en `localStorage`.

```json
{
  "H2O": {
    "data": { "cid": 962, "molecularMass": 18.015, "smiles": "O", "inchiKey": "XLYOFNOQVPJJNP-UHFFFAOYSA-N", "imageUrl": "…" },
    "storedAt": 1756569660000,
    "lastAccess": 1756569660000
  }
}
```

**Indexado por `key` canónica de Hill**, no por `formula`. Es la misma clave con la que el motor identifica el compuesto.

### TTL

**7 días**, según la nota del frame 09: *"Si la respuesta está en caché de localStorage (TTL 7 días) esta pantalla no aparece."*

Una entrada vencida no se borra al leerla: se marca como vencida y se intenta refrescar. **Si el refresco falla, se sirve la entrada vencida** con la leyenda `Información de PubChem del {fecha}`. Un dato de ocho días es mejor que ninguno, y la descripción §31 pide usar datos cacheados cuando existan.

### Flujo

Implementa el diagrama de la descripción §9:

```
Solicitar compuesto
        │
   ¿en caché y vigente? ──sí──→ usar caché, no hay pantalla de loading
        │no
   ¿navigator.onLine? ──no──→ ¿hay caché vencida?
        │sí                        ├─sí→ servirla, avisando la fecha
        │                          └─no→ error `offline`
   consultar PubChem
        ├─ok────→ guardar en caché → mostrar
        └─error─→ ¿hay caché vencida?
                     ├─sí→ servirla, avisando la fecha
                     └─no→ mostrar error, con los datos locales intactos
```

### Límite de tamaño

Descripción §9: *"No se deben almacenar respuestas ilimitadas."*

- **Máximo 120 entradas.** El tope tiene que superar al dataset: por debajo de sus 81 compuestos, recorrer el laboratorio desaloja entradas que se van a volver a pedir. 120 deja margen para los compuestos que solo conoce PubChem.
- Al llegar al límite se elimina la entrada de `lastAccess` más antiguo. LRU simple.
- Cada entrada ronda los 200 bytes. 60 entradas son ~12 KB: muy por debajo de los ~5 MB de `localStorage`. **No se necesita IndexedDB**, que la descripción §3.1 admite solo *"si resulta necesario para cachear datos externos de mayor tamaño"*. Las imágenes, que sí son grandes, las maneja el Service Worker.

### Fallo de escritura

`localStorage.setItem` puede lanzar `QuotaExceededError` o fallar por completo en modo privado. Es el "error de almacenamiento" de la descripción §36.

- `storage.js` envuelve toda escritura en `try/catch`.
- Si falla el guardado de caché: se descarta la entrada y la aplicación sigue. La caché es una optimización, no un requisito de funcionamiento.
- Si falla el guardado de favoritos, historial o descubrimientos: se muestra un toast `No pudimos guardar tus datos en este navegador.` y el estado en memoria se conserva para la sesión en curso.
- Descripción §7.2: *"la aplicación debe continuar funcionando en modo degradado."*

---

## 5. Estados de interfaz

### Loading — frame 09

Skeleton, no spinner. Con el texto `Consultando información química…`, según descripción §26.

- **No aparece si la caché está vigente.** El paso de la mezcla al resultado es inmediato.
- El bloque lleva `aria-busy="true"` y `role="status"`.
- Solo cubre el área del bloque atribuido a PubChem. Fórmula, nombre, composición y descripción interna se pintan de entrada: son locales y ya están.

### Error parcial — frame 11

El compuesto está identificado; falló el enriquecimiento.

```
No pudimos obtener información adicional.
Los datos básicos siguen disponibles.
[ Reintentar ]
```

La ficha conserva fórmula, nombre, composición y descripción. **El descubrimiento se registra igual**: identificar el compuesto es trabajo del motor local (SPEC 08 §9), y no depende de que PubChem responda.

### Error total — frame 22

Se muestra cuando el enriquecimiento falla y además no hay nada que mostrar en el bloque externo.

```
No pudimos consultar PubChem

La red no respondió a tiempo. Tu mezcla H₂O sigue
guardada; volvé a intentar cuando tengas señal.

timeout tras 8 s · intento 2 de 3

[ Reintentar ]        ← acción primaria
[ Editar mezcla ]     ← secundaria
```

- **"Reintentar" es la acción primaria.** La crítica del diseño señaló que en los 20 frames originales no había ningún "Reintentar"; el frame 22 lo corrigió y se respeta.
- El mensaje menciona que la mezcla sigue guardada. Es cierto por la persistencia de `chemlab_mixture` (SPEC 07 §1), y es la información que baja la ansiedad del usuario.
- El bloque lleva `role="alert"` e ícono SVG: el color no es el único portador del estado.

### Sin información externa

Cuando PubChem responde correctamente pero sin los campos esperados (`type: 'data'`):

```
La información ampliada no está disponible actualmente.
```

Se diferencia de "no hay compuesto" (frame 11, sección superior) y de "falló la red" (frame 22). La crítica marcó que el diseño conflacionaba "sin compuesto" con "falló la API" en una sola pantalla; acá quedan separados.

---

## 6. Seguridad

Descripción §34.

- **Sin claves ni secretos.** PubChem PUG REST es público y no requiere credenciales.
- **Toda respuesta externa es dato no confiable.** Se valida la forma antes de usarla.
- **Nunca `innerHTML` ni `v-html` con contenido de PubChem.** Se usa interpolación de Vue, que escapa por defecto, o `textContent`.
- `smiles` e `inchiKey` se renderizan como texto plano dentro de `<code>`.
- `imageUrl` se construye a partir del `cid` numérico validado, no de un string arbitrario de la respuesta.
