# ⚗️ ChemLab

**Laboratorio químico interactivo.** Explorá los 118 elementos de la tabla periódica, combinalos y descubrí compuestos reales.

Trabajo Integrador — Módulo 1 · Aplicaciones Móviles · 2026

### 🔗 [gianluca-v.github.io/ChemLab](https://gianluca-v.github.io/ChemLab/)

Aplicación en vivo. Instalable desde el navegador y funcional sin conexión.

---

## Qué es

Una aplicación web móvil que permite recorrer la tabla periódica, consultar las propiedades de cada elemento, seleccionarlos en cantidades para formar una composición, y comprobar si esa composición coincide con un compuesto registrado.

Cuando hay coincidencia, ChemLab muestra la fórmula, el nombre y la información científica del compuesto, enriquecida con datos de **PubChem** cuando hay conexión: masa molecular, CID, SMILES, InChIKey y la imagen de su estructura molecular.

El progreso se persiste: los compuestos que vas encontrando quedan registrados como **descubrimientos**, con su contador sobre el total del dataset.

**Sin backend.** Todo corre en el navegador.

### Lo que ChemLab no hace

No simula reacciones químicas, no predice productos, no calcula termodinámica ni balancea ecuaciones. Que un compuesto exista en el dataset significa que hay una entrada compatible en el sistema, **no** que la mezcla lo produzca espontáneamente en condiciones reales. El objetivo del motor es educativo: relacionar composiciones conocidas con información química disponible.

---

## Qué se puede hacer

- **Laboratorio.** Elegir elementos de la tabla periódica en cantidades, armar una composición y combinar.
- **Búsqueda y filtros.** Buscar elementos y compuestos, filtrar por categoría, recorrer resultados paginados.
- **Detalle.** Ficha completa de cada elemento y cada compuesto, con datos de PubChem cuando hay red.
- **Favoritos.** Marcar elementos y compuestos, con valoración por estrellas y nota propia.
- **Historial.** Los detalles visitados, en orden.
- **Descubrimientos.** Los compuestos encontrados, con el progreso sobre el total.
- **Contacto.** Formulario y mapa de ubicación.
- **Tema claro y oscuro**, elegido por el usuario y recordado entre sesiones.
- **Instalable y offline.** Se agrega a la pantalla de inicio y sigue funcionando sin conexión.

### Destacados técnicos

**Motor de combinación.** Normaliza la selección a una clave canónica en **notación de Hill** —el estándar de Chemical Abstracts y PubChem— y resuelve con un único lookup en un índice `Map`. El orden de selección es irrelevante por construcción: el estado es un mapa símbolo→cantidad, no una lista. Si la clave exacta no existe, reintenta con la composición reducida por su MCD, de modo que H₄O₂ identifica agua sin romper O₂, H₂ ni N₂.

**El resultado de combinar es una ruta, no un `ref`.** El modal es compartible por URL, Atrás lo cierra en vez de sacar al usuario del laboratorio, y el título del documento sigue cambiando. Un modal gobernado por estado local pierde las tres cosas.

**Offline real.** Los 118 elementos, los 81 compuestos, el motor, los favoritos, el historial y los descubrimientos funcionan sin conexión. Solo degrada lo que depende de PubChem, y lo hace avisando.

**Responsive sin JavaScript.** Ni un solo listener de `resize`. Todos los breakpoints son CSS; lo que cambia por contexto lo decide la ruta, no el ancho de la pantalla.

**Accesibilidad.** Todo control es un elemento real —nunca un `<div>` con handler—, 44 px de piso táctil en acciones primarias, foco visible, contraste ≥4.5:1 en ambos temas, y el color nunca como único portador de información.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Vue 3 — Composition API, `<script setup>` |
| Build | Vite 6 |
| Routing | Vue Router 4, modo hash |
| Estado compartido | Composables propios, sin librería de estado |
| Estilos | CSS propio con custom properties. Sin librería de UI |
| Datos externos | PubChem PUG REST vía Fetch API |
| Persistencia | `localStorage` · `sessionStorage` |
| PWA | Web App Manifest + Service Worker propio |
| Despliegue | GitHub Actions → GitHub Pages |

**Dependencias de producción: `vue` y `vue-router`.** No se usa ninguna librería de UI, de estilos, de estado ni de utilidades.

### Nota sobre el framework

La consigna admite Vanilla JS y prohíbe frameworks de UI. **El equipo decidió usar Vue 3 + Vite**, de forma deliberada y con conocimiento de esa restricción.

Lo que se preservó pese al desvío:

- **La capa de dominio es JavaScript plano.** Los seis módulos de `src/services/` no importan Vue, no usan `ref` ni `reactive` y no tocan el DOM. El motor de normalización química funciona y se verifica fuera del framework.
- **El CSS es propio**, construido sobre los tokens del documento de diseño. Sin Tailwind, sin Bootstrap, sin ninguna librería de estilos.
- **El Service Worker está escrito a mano**: `install`, `activate`, `fetch` y `message` son código propio en [`src/sw.js`](src/sw.js). `vite-plugin-pwa` se usa únicamente en modo `injectManifest`, para inyectar la lista de archivos versionados del build. No aporta estrategias de caché ni runtime de Workbox.

---

## Cómo ejecutarlo

**Requisitos:** Node.js 20+ y npm.

```bash
npm install
npm run dev        # servidor de desarrollo
```

```bash
npm run build      # build de producción en dist/
npm run preview    # sirve dist/ localmente — necesario para probar la PWA
```

El Service Worker **no se registra en modo desarrollo**. Para probar instalación, caché y funcionamiento offline hay que usar `build` + `preview`, o directamente la aplicación publicada.

**Navegadores:** Chrome/Edge 90+, Firefox 98+, Safari 15.4+. Requiere soporte de ES Modules, CSS Grid, `<dialog>`, `oklch()` y `color-mix()`.

---

## Arquitectura

```
views / components  →  composables  →  services  →  (localStorage · fetch · datasets)
```

Dirección única, sin ciclos. Las reglas que la sostienen:

- `src/services/` es JavaScript plano: no importa `vue`, no usa `ref` ni `reactive`, no toca el DOM.
- Ningún servicio importa un composable. Ningún composable importa un componente. Ninguna vista importa otra vista.
- `storage.js` es el único acceso a `localStorage` y `sessionStorage`. Ningún otro módulo escribe una clave literal.
- `api.js` es el único módulo que conoce URLs de PubChem.

```
src/
├── services/      dominio: JS plano, sin Vue
├── composables/   estado compartido, persistido
├── components/    35 componentes reutilizables
├── views/         12 vistas, una por ruta
├── router/        rutas, navegación y registro de historial
├── assets/css/    variables.css (tokens) · base.css
└── sw.js          Service Worker
```

### Despliegue

Cada push a `main` dispara [`deploy.yml`](.github/workflows/deploy.yml): `npm ci`, `npm run build` y publicación de `dist/` en GitHub Pages.

Dos decisiones hacen que funcione bajo un subdirectorio como `/ChemLab/`:

- **`base: './'` en `vite.config.js`.** Todas las URLs del build son relativas, así que el sitio no depende de estar servido en la raíz del dominio.
- **Router en modo hash.** GitHub Pages no reescribe rutas hacia `index.html`. Con el modo `history`, recargar en `/discoveries` daría 404. Con hash, no hay servidor involucrado.

Actualizar la aplicación no borra los datos del usuario: el Service Worker administra `Cache Storage`, mientras que favoritos, historial y descubrimientos viven en `localStorage`, que el Service Worker no puede tocar.

---

## Datos

- **Elementos:** dataset local con los 118 elementos y 18 campos cada uno. Los valores no disponibles se representan con `null` explícito, nunca inventados.
- **Compuestos:** 81 entradas propias de ChemLab, con clave en notación de Hill, fórmula, nombre, composición y descripción.
- **Enriquecimiento:** [PubChem PUG REST](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) — API pública, sin credenciales.

El dato interno y el externo se mantienen separados: la información de PubChem nunca se escribe en el dataset, vive en caché con TTL de 7 días y se identifica como tal en la interfaz.

### Persistencia

Seis claves en `localStorage`, más una en `sessionStorage`, todas a través de `storage.js`:

```
chemlab_favorites   chemlab_history   chemlab_discovered
chemlab_mixture     chemlab_theme     chemlab_api_cache

chemlab_contact_messages   ← sessionStorage
```

El formulario de contacto **no envía correos**: guarda en la sesión para demostrar el almacén. Cerrar la pestaña lo vacía y no toca los favoritos.

---

## Documentación

El proyecto se especificó antes de escribirse. La especificación técnica completa vive en [`specs/`](specs/) —20 documentos— y es la fuente de verdad por encima del código y del diseño. Empezar por [`specs/README.md`](specs/README.md).

El documento de diseño original está en [`design-import/`](design-import/) sin modificar; [`CORRECCIONES.md`](design-import/CORRECCIONES.md) registra qué de ese diseño no se implementó tal cual y por qué.

---

## Integrantes

- Gianluca Vespe
- Sergio López

Los datos de contacto que muestra la aplicación en su vista Contacto son ficticios, por decisión del equipo. La identificación real se hace acá.

---

## Licencia

Trabajo académico. Los datos de compuestos provienen de [PubChem](https://pubchem.ncbi.nlm.nih.gov/), de dominio público. El mapa de la vista Contacto usa [OpenStreetMap](https://www.openstreetmap.org/copyright), bajo ODbL.
