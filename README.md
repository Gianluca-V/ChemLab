# ⚗️ ChemLab

**Laboratorio químico interactivo.** Explorá los 118 elementos de la tabla periódica, combinalos y descubrí compuestos reales.

Trabajo Integrador — Módulo 1 · Aplicaciones Móviles · 2026

> **Estado actual: especificación completa, implementación no iniciada.**
> Las 20 SPECs de `specs/` están cerradas y aprobadas. El código todavía no existe.

---

## Qué es

Una aplicación web móvil que permite recorrer la tabla periódica, consultar las propiedades de cada elemento, seleccionarlos en cantidades para formar una composición, y comprobar si esa composición coincide con un compuesto registrado.

Cuando hay coincidencia, ChemLab muestra la fórmula, el nombre y la información científica del compuesto, enriquecida con datos de **PubChem** cuando hay conexión: masa molecular, CID, SMILES, InChIKey y la imagen de su estructura molecular.

El progreso se persiste: los compuestos que vas encontrando quedan registrados como **descubrimientos**, con su contador sobre el total del dataset.

**Sin backend.** Todo corre en el navegador.

### Lo que ChemLab no hace

No simula reacciones químicas, no predice productos, no calcula termodinámica ni balancea ecuaciones. Que un compuesto exista en el dataset significa que hay una entrada compatible en el sistema, **no** que la mezcla lo produzca espontáneamente en condiciones reales. El objetivo del motor es educativo: relacionar composiciones conocidas con información química disponible.

---

## Estado del proyecto

| Etapa | Estado |
|---|---|
| Análisis de requisitos | ✅ completo — SPEC 19 |
| Diseño visual (28 frames, mobile first) | ✅ completo — `design-import/` |
| Especificación técnica (20 documentos) | ✅ completo — `specs/` |
| Datasets (`elements.json`, `compounds.json`) | ⬜ pendiente |
| Implementación | ⬜ no iniciada |
| PWA | ⬜ no iniciada |

**Próximos pasos** en [`specs/README.md`](specs/README.md#pendientes-antes-de-implementar).

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Vue 3 — Composition API, `<script setup>` |
| Build | Vite |
| Routing | Vue Router 4, modo hash |
| Estado compartido | Composables propios, sin librería de estado |
| Estilos | CSS propio con custom properties. Sin librería de UI |
| Datos externos | PubChem PUG REST vía Fetch API |
| Persistencia | `localStorage` |
| PWA | Web App Manifest + Service Worker propio |

**Dependencias de producción: `vue` y `vue-router`.** No se usa ninguna librería de UI, de estilos, de estado ni de utilidades.

### Nota sobre el framework

La consigna admite Vanilla JS y prohíbe frameworks de UI. **El equipo decidió usar Vue 3 + Vite**, de forma deliberada y con conocimiento de esa restricción. La decisión, su motivo y sus consecuencias están documentadas en [SPEC 19 §1.3](specs/19-requisitos-y-aceptacion.md).

Lo que se preservó pese al desvío:

- **La capa de dominio es JavaScript plano.** `chemistry.js`, `storage.js`, `api.js` y `cache.js` no importan Vue, no usan `ref` ni `reactive` y no tocan el DOM. El motor de normalización química funciona y se verifica fuera del framework.
- **El CSS es propio**, construido sobre los tokens del documento de diseño. Sin Tailwind, sin Bootstrap, sin ninguna librería de estilos.
- **El Service Worker está escrito a mano**: `install`, `activate` y `fetch` son código propio.

---

## Cómo ejecutarlo

> Aplicable una vez iniciada la implementación.

**Requisitos:** Node.js 20+ y npm.

```bash
npm install
npm run dev        # servidor de desarrollo
```

```bash
npm run build      # build de producción en dist/
npm run preview    # sirve dist/ localmente — necesario para probar la PWA
```

El Service Worker **no se registra en modo desarrollo**. Para probar instalación, caché y funcionamiento offline hay que usar `build` + `preview`.

**Navegadores:** Chrome/Edge 90+, Firefox 98+, Safari 15.4+. Requiere soporte de ES Modules, CSS Grid, `<dialog>`, `oklch()` y `color-mix()`. La evaluación principal es en Google Chrome.

---

## Estructura

```
├── CLAUDE.md                  instrucciones para agentes de IA
├── specs/                     ← especificación técnica (fuente de verdad)
│   ├── README.md              índice, decisiones, contradicciones resueltas
│   └── 00…19-*.md             20 documentos
├── design-import/
│   ├── CORRECCIONES.md        ← qué del diseño NO se implementa tal cual
│   └── ChemLab Mobile First.dc.html    28 frames, sin modificar
├── docs/
│   └── critica-diseno.md      auditoría previa del diseño (histórica)
├── public/
│   ├── data/                  elements.json · compounds.json
│   ├── fonts/                 Space Grotesk · IBM Plex Mono (autoalojadas)
│   └── icons/                 192 · 512 · maskable
└── src/
    ├── services/              dominio: JS plano, sin Vue
    ├── composables/           estado compartido, persistido
    ├── components/            componentes reutilizables
    ├── views/                 una por ruta
    └── sw.js                  Service Worker
```

---

## Documentación

**Orden de precedencia:**

1. **[`specs/`](specs/)** — fuente de verdad. Prevalece sobre todo lo demás.
2. **[`design-import/CORRECCIONES.md`](design-import/CORRECCIONES.md)** — qué del diseño no se implementa tal cual.
3. **`design-import/*.dc.html`** — referencia visual. Los 28 frames, los tokens, las dimensiones.

⚠️ El documento de diseño **no fue modificado** y conserva copy, marcado y estilos que las SPECs corrigen. Leer `CORRECCIONES.md` antes de implementar cualquier frame.

| Documento | Para qué |
|---|---|
| [`specs/README.md`](specs/README.md) | Índice, 20 decisiones, 8 contradicciones resueltas, pendientes |
| [`specs/19-requisitos-y-aceptacion.md`](specs/19-requisitos-y-aceptacion.md) | RF1–RF14, RNF1–RNF10, criterios de aceptación, preguntas de la defensa |
| [`CLAUDE.md`](CLAUDE.md) | Convenciones y trampas conocidas, para agentes de IA |
| [`docs/critica-diseno.md`](docs/critica-diseno.md) | Auditoría del diseño previa a las SPECs. Histórico |

---

## Funcionalidades

| ID | Requisito | SPEC |
|---|---|---|
| RF1 | Home y navegación desde cualquier punto | [13](specs/13-home-y-contacto.md) |
| RF2 | Búsqueda con filtros | [04](specs/04-busqueda-y-filtros.md) |
| RF3 | Resultados paginados | [05](specs/05-resultados-y-paginacion.md) |
| RF4 | Detalle de elemento y compuesto | [06](specs/06-detalle.md) |
| RF5 | Favoritos con valoración y nota | [10](specs/10-favoritos.md) |
| RF6 | Historial de detalles visitados | [11](specs/11-historial.md) |
| RF7 | Contacto con mapa | [13](specs/13-home-y-contacto.md) |
| RF8 | Diseño responsivo | [16](specs/16-responsive-y-layout.md) |
| RF9 | Laboratorio químico | [07](specs/07-laboratorio-y-mezcla.md) |
| RF10 | Motor de combinación | [08](specs/08-motor-de-combinacion.md) |
| RF11 | Descubrimientos | [12](specs/12-descubrimientos.md) |
| RF12 | Caché de información química | [09](specs/09-pubchem-cache-y-estados-asincronos.md) |
| RF13 | PWA instalable | [18](specs/18-pwa.md) |
| RF14 | Funcionamiento offline | [18 §8](specs/18-pwa.md) |

### Destacados

**Motor de combinación.** Normaliza la selección a una clave canónica en **notación de Hill** (el estándar de Chemical Abstracts y PubChem) y resuelve con un único lookup en un índice `Map`. El orden de selección es irrelevante por construcción: el estado es un mapa símbolo→cantidad, no una lista. Si la clave exacta no existe, reintenta con la composición reducida por su MCD, de modo que H₄O₂ identifica agua sin romper O₂, H₂ ni N₂. — [SPEC 08](specs/08-motor-de-combinacion.md)

**Offline real.** Los 118 elementos, los 30 compuestos, el motor, los favoritos, el historial y los descubrimientos funcionan sin conexión. Solo degrada lo que depende de PubChem, y lo hace avisando. — [SPEC 18 §8](specs/18-pwa.md)

**Accesibilidad.** Todo control es un elemento real, 44 px de piso táctil, foco visible, contraste ≥4.5:1 en ambos temas, y el color nunca como único portador de información. — [SPEC 17](specs/17-accesibilidad.md)

---

## Datos

- **Elementos:** dataset local con los 118 elementos y 17 campos cada uno. Los valores no disponibles se representan con `null` explícito, nunca inventados.
- **Compuestos:** 30 entradas propias de ChemLab, con fórmula, nombre, composición y descripción.
- **Enriquecimiento:** [PubChem PUG REST](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) — API pública, sin credenciales.

El dato interno y el externo se mantienen separados: la información de PubChem nunca se escribe en el dataset, vive en caché con TTL de 7 días y se identifica como tal en la interfaz. — [SPEC 02 §4](specs/02-contratos-de-datos.md)

---

## Integrantes

- Gianluca Vespe
- Sergio López

Los datos de contacto que muestra la aplicación en su vista Contacto son ficticios, por decisión del equipo. La identificación real se hace acá. — [SPEC 13 §B.1](specs/13-home-y-contacto.md)

---

## Licencia

Trabajo académico. Los datos de compuestos provienen de [PubChem](https://pubchem.ncbi.nlm.nih.gov/), de dominio público. El mapa de la vista Contacto usa [OpenStreetMap](https://www.openstreetmap.org/copyright), bajo ODbL.
