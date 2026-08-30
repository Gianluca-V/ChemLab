# SPEC 18 — PWA: manifest, Service Worker y offline

**Estado:** aprobado
**Depende de:** SPEC 00, SPEC 01, SPEC 09, SPEC 13, SPEC 14
**Fuentes:** descripción §28–§33, RF13, RF14, RNF4; frame 01
**Archivos:** `vite.config.js`, `src/sw.js`, `src/main.js`, `public/manifest.webmanifest`, `public/icons/`

---

## 1. Estrategia: `injectManifest`

El Service Worker se escribe a mano. `vite-plugin-pwa` cumple **una sola función**: reemplazar el marcador `self.__WB_MANIFEST` por la lista real de archivos hasheados del build.

```js
// vite.config.js
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.js',
  registerType: 'prompt',
  injectManifest: {
    globPatterns: ['**/*.{js,css,html,woff2,json,png,svg,webmanifest}'],
  },
  manifest: { /* §2 */ },
})
```

> **Por qué no `generateSW`.** En un proyecto de producción, `generateSW` sería la elección correcta: Workbox está probado a escala y resuelve casos borde —respuestas opacas de CORS, peticiones `Range`, navigation preload— que un SW casero rompe. Técnicamente cubre todo lo que ChemLab necesita.
>
> Se elige `injectManifest` por el contexto de evaluación: la descripción §42 incluye *"cómo funciona el Service Worker"* y *"qué recursos se cachean"* entre las preguntas de la defensa, y la PWA es un PLUS evaluable. Con `injectManifest`, `install`, `activate` y `fetch` son código propio, señalable línea por línea.
>
> **Por qué no un `sw.js` manual sin plugin.** Obligaría a desactivar el hasheo de nombres de Vite, y con él el cache busting: tras cada deploy el navegador serviría el JavaScript viejo desde su caché HTTP. Además, cada archivo nuevo que no se agregue a mano a la lista sería un recurso ausente offline, sin ningún aviso.

---

## 2. Web App Manifest

`public/manifest.webmanifest`. Los once campos que exige la descripción §28.1.

```json
{
  "name": "ChemLab — Laboratorio químico interactivo",
  "short_name": "ChemLab",
  "description": "Explorá los 118 elementos de la tabla periódica, combinalos y descubrí compuestos reales.",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "theme_color": "#0f1116",
  "background_color": "#0c0d11",
  "orientation": "any",
  "lang": "es-AR",
  "dir": "ltr",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

| Campo | Valor y motivo |
|---|---|
| `start_url` / `scope` | `./` — relativos, para que funcione en un subdirectorio de GitHub Pages sin reconfigurar |
| `display` | `standalone`, exigido por la consigna |
| `theme_color` | `--surface-1` del tema oscuro. Tiñe la barra de estado del sistema |
| `background_color` | `--surface-0`. Es el color de la pantalla de arranque, antes de que cargue el CSS |
| `orientation` | **`any`** — ver nota |
| `icons` | 192 y 512 obligatorios, más un `maskable` |

> **`orientation: "any"`, no `portrait`.** La descripción §28.1 lista el campo como requerido pero no fija su valor. Se usa `any` porque SPEC 16 especifica cuatro contextos, incluidos mobile landscape, tablet y desktop. Bloquear a `portrait` contradiría RF8 y dejaría inaccesible el panel lateral de los frames 27 y 28.

### Íconos

- `icon-192.png` y `icon-512.png`: el ícono completo, con su propio fondo.
- `maskable-512.png`: con la zona segura respetada —el contenido dentro del 80 % central—, para que Android pueda recortarlo en círculo, cuadrado redondeado o gota sin comer el logo.

Sin la variante `maskable`, Android encierra el ícono en un cuadrado blanco. Ningún frame del diseño define íconos: se derivan de la marca "C ChemLab" del `TopBar`.

El manifest se enlaza desde `index.html`:

```html
<link rel="manifest" href="./manifest.webmanifest">
<meta name="theme-color" content="#0f1116">
```

---

## 3. Registro

Una sola línea, y es **el único punto de activación manual de todo el sistema**:

```js
// src/main.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

Todo lo que sigue —`install`, `activate`, `fetch`— lo dispara el navegador solo. No son comandos ni acciones del usuario: son eventos del ciclo de vida, del mismo modo que `click` es un evento del ciclo de vida de un botón.

La guarda `'serviceWorker' in navigator` evita romper en navegadores sin soporte. La aplicación funciona igual sin SW: pierde el offline, nada más.

---

## 4. `src/sw.js`

```js
const VERSION = 'v1';
const SHELL   = `chemlab-shell-${VERSION}`;
const RUNTIME = `chemlab-runtime-${VERSION}`;

const PRECACHE = self.__WB_MANIFEST.map(entry => entry.url);
```

`self.__WB_MANIFEST` es el marcador que el plugin reemplaza en el build por la lista de archivos con sus nombres hasheados.

### `install` — precachear el App Shell

```js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then(cache => cache.addAll(PRECACHE))
  );
});
```

`event.waitUntil` impide que el navegador dé la instalación por terminada antes de que resuelva la promesa. Sin él, el SW puede morir a mitad de la descarga.

`cache.addAll` es **atómico**: si un solo archivo falla, falla toda la instalación y el SW no se activa. Es el comportamiento deseado — un shell incompleto es peor que ninguno.

### `activate` — limpiar versiones anteriores

```js
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});
```

Sin esta limpieza, cada deploy deja una caché huérfana acumulándose hasta agotar la cuota del origen.

`clients.claim()` hace que el SW recién activado tome control de las pestañas ya abiertas, sin esperar una recarga.

### `fetch` — el proxy

```js
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin === location.origin) {
    return event.respondWith(cacheFirst(request));
  }
  if (url.hostname.endsWith('ncbi.nlm.nih.gov')) {
    return event.respondWith(networkFirst(request));
  }
  // resto (iframe de OpenStreetMap): sin interceptar
});
```

Un `return` sin `respondWith` deja que el navegador resuelva la petición normalmente. No hace falta "dejar pasar" nada de forma explícita.

Solo se interceptan `GET`. Cachear otros métodos no tiene sentido y `cache.put` los rechaza.

### Las dos estrategias — descripción §30

```js
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.mode === 'navigate') return caches.match('/index.html');
    return Response.error();
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) ?? Response.error();
  }
}
```

| Estrategia | Para qué | Por qué |
|---|---|---|
| **Cache First** | JS, CSS, HTML, fuentes, `elements.json`, `compounds.json`, íconos | No cambian sin un deploy nuevo, y el hash del nombre garantiza que un deploy produzca URLs distintas |
| **Network First** | Imágenes de estructura de PubChem | Datos de terceros: se prefiere el dato fresco cuando hay red, con caída a caché sin ella |

> **`response.clone()` es obligatorio.** El cuerpo de una `Response` es un stream de lectura única. Guardar la respuesta original en la caché entrega a la página un stream ya consumido y la deja en blanco. Es el error más frecuente en Service Workers escritos a mano.

**Los datos JSON de PubChem no pasan por el SW.** Su caché con TTL de 7 días la maneja `cache.js` a nivel de aplicación (SPEC 09 §4), porque necesita lógica de vencimiento, LRU y servido de entradas vencidas que el SW no tiene por qué conocer. El SW solo se ocupa de las imágenes.

### El hash routing simplifica el fallback

Con `createWebHashHistory`, las 12 rutas son la misma URL para el servidor: el fragmento posterior al `#` nunca viaja en la petición. `cacheFirst` sirviendo `/index.html` desde el precache resuelve todas las rutas sin lógica de navegación adicional.

Con history mode haría falta un handler que mapee cualquier path al shell. La decisión de SPEC 01 §1 se paga acá.

---

## 5. Contenido del precache

Lo que exige la descripción §29, cubierto por `globPatterns`:

| Recurso | Patrón |
|---|---|
| `index.html` | `**/*.html` |
| `manifest.webmanifest` | `**/*.webmanifest` |
| JS del bundle | `**/*.js` |
| CSS del bundle | `**/*.css` |
| `elements.json`, `compounds.json` | `**/*.json` |
| Fuentes autoalojadas | `**/*.woff2` |
| Íconos | `**/*.png`, `**/*.svg` |

Las fuentes están en el precache porque se autoalojan (SPEC 14 §4). Si se cargaran desde Google Fonts, offline caerían a la fuente del sistema y la tipografía —parte del diseño evaluado— desaparecería.

---

## 6. Actualización — descripción §33

```js
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
```

Flujo con `registerType: 'prompt'`:

```
deploy → los archivos cambian de hash → sw.js cambia de bytes
   ↓
el navegador detecta un SW distinto y lo instala
   ↓
el SW nuevo queda en 'waiting' — NO se activa solo
   ↓
la app detecta el SW esperando y muestra:

    Nueva versión disponible.        [ Actualizar ]
   ↓
Actualizar → postMessage({type:'SKIP_WAITING'}) → activate → recarga
```

**No se actualiza sin avisar.** Activar un SW nuevo mientras la aplicación corre cambia el código bajo los pies del usuario, que puede estar a mitad de escribir una nota de 200 caracteres.

### Qué sobrevive a la actualización

Descripción §33: la actualización **no debe eliminar** favoritos, historial, descubrimientos ni preferencias.

Se cumple por construcción: esos datos viven en **`localStorage`**, y el SW solo administra **`Cache Storage`**. Son dos almacenes distintos; `caches.delete()` no puede tocar `localStorage`.

| Almacén | Contenido | ¿Lo borra el update? |
|---|---|---|
| `Cache Storage` | App Shell, fuentes, datasets, imágenes | **sí**, las versiones viejas |
| `localStorage` | favoritos, historial, descubrimientos, mezcla, tema, caché de API | **no** |

Es la razón concreta por la que `storage.js` es la única puerta a `localStorage` (SPEC 00 §5) y por la que el SW no la toca nunca.

---

## 7. Instalación — descripción §32

```js
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();          // evita el banner automático del navegador
  deferredPrompt = e;          // lo guardamos para dispararlo nosotros
  showInstallButton.value = true;
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  showInstallButton.value = false;
});
```

`InstallPrompt` (SPEC 13 §A.4) se renderiza **solo** con `deferredPrompt` presente:

```
[ Instalar ChemLab ]
```

Descripción §32: *"El botón no debe aparecer cuando la aplicación ya esté instalada o cuando la instalación no esté disponible."* Se cumple porque `beforeinstallprompt` no se dispara en ninguno de esos dos casos.

Al tocarlo: `deferredPrompt.prompt()`, y se descarta la referencia — el evento es de un solo uso.

Ubicación: Home y `NavDrawer`. Ningún frame lo dibuja; es un hueco de diseño, resuelto con el estilo de acción secundaria ya definido.

---

## 8. Alcance del offline — descripción §31

### Funciona sin conexión

Home · tabla periódica · búsqueda local · filtros · resultados · detalle de elemento · laboratorio · motor de combinación · compuestos del dataset · favoritos (alta, edición, baja) · historial · descubrimientos · tema · navegación entre las 12 rutas.

Todo eso es local: datasets precacheados, motor en `chemistry.js`, estado en `localStorage`.

### Degrada

| Función | Sin conexión |
|---|---|
| Enriquecimiento de compuesto | Caché si existe, con su fecha; si no, frame 22 |
| Imagen de estructura | Caché si existe; si no, placeholder |
| Mapa de contacto | Bloque estático con dirección y coordenadas (SPEC 13 §B.4) |

**El descubrimiento se registra igual sin conexión.** Identificar el compuesto es trabajo del motor local; PubChem solo enriquece (SPEC 08 §9, SPEC 12 §3).

---

## 9. Versionado

`VERSION` se incrementa a mano cuando cambia la forma de las cachés. No hace falta tocarlo en cada deploy: el hash de los archivos ya invalida el contenido.

Sirve para forzar una limpieza total cuando cambia la estructura del SW.

---

## 10. Verificación antes de la entrega

1. **Lighthouse → Installable**: manifest válido, SW registrado, servido por HTTPS.
2. **DevTools → Application → Service Workers**: estado `activated`.
3. **DevTools → Application → Cache Storage**: confirmar que están HTML, JS, CSS, fuentes, ambos JSON e íconos.
4. **Marcar Offline y recargar**: la aplicación abre y las 12 rutas navegan.
5. **Offline + COMBINAR**: el compuesto se identifica, el descubrimiento se registra, PubChem muestra el estado degradado.
6. **Instalar en Android o desktop**: ícono correcto, sin barra de direcciones, `theme_color` aplicado.
7. **Deploy nuevo**: aparece el aviso de versión disponible; tras actualizar, favoritos, historial y descubrimientos siguen intactos.
