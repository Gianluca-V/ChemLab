# SPEC 19 — Requisitos, restricciones y criterios de aceptación

**Estado:** aprobado
**Depende de:** todas las SPECs
**Fuentes:** descripción §3, §37, §39–§45; consigna del Trabajo Integrador, Módulo 1

Esta SPEC absorbe las secciones normativas de la descripción funcional de origen que no tenían lugar en una SPEC de vista: restricciones tecnológicas, RF1–RF14, RNF1–RNF10, criterios de aceptación, preguntas de la defensa, reglas de comunicación científica y límites del sistema.

**El documento de origen ya no se versiona.** Todo su contenido normativo está transcrito acá; el resto quedó distribuido en las SPECs 00–18. Esta SPEC es ahora la referencia única de requisitos.

---

## 1. Restricciones tecnológicas

### 1.1 Permitido

HTML5 · CSS3 · JavaScript ES6+ · Fetch API · JSON · REST APIs · `localStorage` · APIs nativas del navegador · Service Worker · Web App Manifest · Cache Storage · IndexedDB únicamente si el volumen de datos externos lo justifica.

> IndexedDB **no se usa**. La caché de PubChem son ~60 entradas de unos 200 bytes: ~12 KB contra los ~5 MB de `localStorage`. Las imágenes, que sí son grandes, las administra el Service Worker en `Cache Storage`. (SPEC 09 §4)

### 1.2 Prohibido por la consigna

React · Vue · Angular · Svelte · Next.js · Astro · jQuery · Bootstrap · Tailwind · Material UI · Ant Design · Chakra UI · cualquier framework o librería de UI.

La consigna admite Vanilla JS y exige CSS propio para el diseño responsivo.

### 1.3 Desvío registrado: Vue 3 + Vite

> **El proyecto usa Vue 3 + Vite, en contradicción directa con §1.2 y con el criterio de aceptación "el proyecto no utilice frameworks" (§4, punto 26).**
>
> La decisión fue tomada y confirmada de forma expresa por el equipo, con pleno conocimiento de la contradicción, que le fue presentada con la cita textual antes de proceder.
>
> Consecuencias que el equipo asume:
> - Incumple una restricción explícita de la consigna.
> - La pregunta de defensa "por qué se utiliza Vanilla JS" (§5) no tiene respuesta afirmativa; debe responderse explicando la decisión y su motivo.
>
> **Lo que se preservó pese al desvío:** la capa de dominio —`chemistry.js`, `storage.js`, `cache.js`, `api.js`— es JavaScript plano, sin una sola importación de Vue. El motor de normalización, el cliente de PubChem y el acceso a persistencia funcionan y se verifican fuera del framework. El CSS es propio, con tokens del diseño, sin ninguna librería de estilos. (SPEC 00 §2, SPEC 08 §2)
>
> **Reversión.** Si el equipo decide volver a Vanilla JS, cambian SPEC 00 y las partes de routing y de componentes. Las SPECs 02, 08, 09, 14, 17 y 18 —contratos de datos, motor, API y caché, design system, accesibilidad y PWA— no cambian una línea.

### 1.4 Sin backend

No existe servidor de aplicación. Navegación, renderizado, búsqueda, filtrado, selección, combinación, persistencia, favoritos, historial, caché y comunicación con APIs se ejecutan íntegramente en el navegador.

---

## 2. Requisitos funcionales

| ID | Requisito | Dónde se especifica |
|---|---|---|
| RF1 | Home y navegación desde cualquier punto | SPEC 13 §A, SPEC 01 §6 |
| RF2 | Búsqueda con al menos 3 filtros | SPEC 04 |
| RF3 | Visualización de resultados, 10 iniciales + acceso al resto | SPEC 05 |
| RF4 | Detalle, con registro automático en historial | SPEC 06, SPEC 01 §5 |
| RF5 | Lista de deseos / favoritos con persistencia | SPEC 10 |
| RF6 | Historial de detalles visitados | SPEC 11 |
| RF7 | Contacto con ubicación y mapa | SPEC 13 §B |
| RF8 | Diseño responsivo en los cuatro contextos | SPEC 16 |
| RF9 | Laboratorio químico | SPEC 07 |
| RF10 | Motor de combinación | SPEC 08 |
| RF11 | Descubrimientos | SPEC 12 |
| RF12 | Caché de información química | SPEC 09 |
| RF13 | PWA instalable | SPEC 18 |
| RF14 | Funcionamiento offline básico | SPEC 18 §8 |

RF1–RF8 son la estructura que define la consigna. RF9–RF14 son funcionalidades propias de ChemLab.

---

## 3. Requisitos no funcionales

| ID | Requisito | Cómo se cumple |
|---|---|---|
| RNF1 | **Responsividad** en móvil portrait ≤480, landscape 481–767, tablet 768–1023 y desktop ≥1024 | SPEC 16 §2. Mobile first, cuatro breakpoints con `min-width`. `body` nunca desborda en horizontal |
| RNF2 | **Compatibilidad**: la evaluación principal es en Google Chrome | Se apunta a Chrome/Edge 90+, Firefox 98+, Safari 15.4+. Requiere soporte de ES Modules, CSS Grid, `<dialog>`, `oklch()` y `color-mix()` |
| RNF3 | **Performance**: operaciones locales sin latencia perceptible | SPEC 03 §7, SPEC 04 §7. Índices `Map` para lookups O(1), delegación de eventos en la tabla, `computed` para filtrado, nombres normalizados precalculados, sin listeners de `resize` |
| RNF4 | **Disponibilidad**: App Shell offline tras la primera carga | SPEC 18 §5, §8. Precache del shell, fuentes y datasets con Cache First |
| RNF5 | **Mantenibilidad**: código modularizado por responsabilidad | SPEC 00 §2, §3. Dirección de dependencias en un solo sentido: `views → composables → services`. Ningún servicio importa un composable |
| RNF6 | **Legibilidad**: nombres claros y ES6+ correcto | SPEC 00. Un nombre por concepto — resuelto en SPEC 10 §1 con la colisión "nota". Módulos de una sola responsabilidad |
| RNF7 | **Accesibilidad**: navegable por teclado y tecnologías asistivas | SPEC 17 completa. Controles reales, 44 px de piso táctil, foco visible, contraste ≥4.5:1, el color nunca como único portador |
| RNF8 | **Seguridad**: sin credenciales ni secretos en el cliente | SPEC 09 §6. PubChem PUG REST es público. Sin `v-html` con contenido externo. Respuestas tratadas como dato no confiable |
| RNF9 | **Persistencia**: los datos sobreviven entre sesiones | SPEC 00 §4, §5. Toda mutación de composable persiste de inmediato vía `storage.js` |
| RNF10 | **Tolerancia a fallos**: una API caída no inutiliza lo local | SPEC 09 §5. El motor identifica compuestos sin red; el descubrimiento se registra igual; los datos básicos siempre se muestran |

---

## 4. Criterios generales de aceptación

Checklist de verificación antes de la entrega.

**Datos y tabla periódica**
1. Existen los 118 elementos — SPEC 02 §1
2. La tabla representa correctamente su organización química — SPEC 03 §2
3. La tabla no genera overflow horizontal de la aplicación — SPEC 03 §4, SPEC 16 §6

**Búsqueda y detalle**
4. La búsqueda funciona por símbolo, nombre y número atómico — SPEC 04 §2
5. Los filtros funcionan y son al menos 3 — SPEC 04 §3
6. El detalle de elementos funciona — SPEC 06 §2
7. Se muestran 10 resultados iniciales con acceso al resto — SPEC 05 §5

**Laboratorio y motor**
8. Se pueden seleccionar elementos — SPEC 03 §6, SPEC 05 §4
9. Se pueden repetir elementos — SPEC 07 §3
10. El orden de selección no afecta la identificación — SPEC 08 §3
11. El laboratorio permite limpiar y modificar la selección — SPEC 07 §3, §5
12. El motor identifica los compuestos incluidos — SPEC 08 §5

**Información externa**
13. PubChem enriquece los resultados con conectividad — SPEC 09 §1
14. Las imágenes aparecen cuando la fuente las provee — SPEC 06 §3

**Favoritos**
15. Se pueden crear — SPEC 10 §3
16. Tienen valoración de 1 a 5 estrellas — SPEC 10 §4
17. Admiten nota de hasta 200 caracteres — SPEC 10 §5
18. Se pueden editar y eliminar — SPEC 10 §7, §8
19. Persisten entre sesiones — SPEC 10 §2

**Historial y descubrimientos**
20. El historial registra únicamente detalles visitados — SPEC 11 §1
21. El historial persiste — SPEC 11 §2
22. Los descubrimientos persisten — SPEC 12 §2

**Contacto y responsive**
23. Existe contacto con la ubicación requerida — SPEC 13 §B.3
24. Todas las vistas son responsive — SPEC 16 §2

**Técnicos**
25. Se usa Fetch API para la comunicación externa — SPEC 09 §3
26. ~~El proyecto no utiliza frameworks~~ — **incumplido por decisión del equipo**, ver §1.3
27. Existen estados de error y de carga — SPEC 15 §1

**PWA**
28. El Manifest es válido — SPEC 18 §2
29. El Service Worker se registra correctamente — SPEC 18 §3
30. El App Shell se cachea — SPEC 18 §5
31. La aplicación abre offline tras haber sido cargada — SPEC 18 §8
32. La PWA se puede instalar — SPEC 18 §7

---

## 5. Restricciones de la defensa

La consigna contempla una defensa grupal en la que **ambos integrantes** deben poder explicar y justificar las decisiones técnicas.

Cada pregunta previsible, con la SPEC que la responde:

| Pregunta | Responde |
|---|---|
| Por qué se utiliza Vanilla JS | **No aplica.** Ver §1.3: hay que explicar el desvío a Vue y qué se preservó |
| Cómo funciona el router | SPEC 01 §1, §2. Vue Router en modo hash, 12 rutas, filtros en query string |
| Cómo se representa la tabla periódica | SPEC 03 §2. Grilla CSS sobre coordenadas químicas reales, bloque f en filas 9–10 |
| Cómo funciona la normalización de elementos | SPEC 08 §3, §4. El orden nunca existe: el estado es un mapa símbolo→cantidad. Clave de Hill |
| Cómo se determina un compuesto | SPEC 08 §5. Lookup exacto en índice `Map`; si falla, reducción por MCD |
| Cómo funciona `localStorage` | SPEC 00 §4, §5. Seis claves, acceso único por `storage.js`, escritura en cada mutación |
| Cómo se realiza la caché de PubChem | SPEC 09 §4. TTL 7 días, LRU de 60 entradas, sirve vencido si el refresco falla |
| Cómo se manejan los errores | SPEC 09 §3, SPEC 15 §6. Cinco tipos: `offline`, `timeout`, `network`, `http`, `data` |
| Cómo funciona el Service Worker | SPEC 18 §4. `install` precachea, `activate` limpia, `fetch` es el proxy. Eventos del navegador, no comandos |
| Qué recursos se cachean | SPEC 18 §5. HTML, JS, CSS, fuentes, ambos datasets, íconos |
| Qué significa funcionar offline | SPEC 18 §8. Qué funciona íntegro y qué degrada |
| Cómo se instala la PWA | SPEC 18 §7. `beforeinstallprompt` diferido, botón condicional |
| Cómo se implementó el responsive | SPEC 16. Mobile first, cuatro `min-width`, panel lateral por CSS sin lógica de ancho en JS |

---

## 6. Reglas de comunicación científica

Obligatorias en toda copy de la interfaz.

- **El O₂ es oxidante y favorece la combustión, no es combustible.** (SPEC 06 §2, bloque de glosario)
- El H₂ puede describirse como altamente inflamable.
- **No se afirman reacciones químicas a partir de una combinación.** La pantalla se titula "Tu mezcla", no "Tu reacción"; el rótulo es "Fórmula tentativa", no "Producto". (SPEC 07 §7)
- Que un compuesto exista en el dataset significa que hay **una entrada compatible en el sistema**, no que la mezcla lo produzca espontáneamente en condiciones reales.
- El mensaje de fracaso dice *"no encontramos un compuesto compatible en la base de datos de ChemLab"*, **nunca** "esta combinación es imposible". (SPEC 08 §7)
- Los tags de peligro describen la propiedad del elemento, jamás un resultado de mezclarlos.

---

## 7. Límites deliberados del sistema

ChemLab **no** pretende: simular reacciones químicas reales, predecir productos, calcular termodinámica, balancear ecuaciones, sustituir una base de datos científica especializada, ni garantizar que una combinación produzca un compuesto en condiciones reales.

El objetivo del motor es educativo e interactivo: **relacionar composiciones conocidas con información química disponible.** (SPEC 08 §1)

---

## 8. Flujo principal

```
                  HOME
                    │
                    ▼
            TABLA PERIÓDICA
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      DETALLE DE          LABORATORIO
       ELEMENTO               │
          │              H + H + O
          │                   │
          │                   ▼
          │                 H₂O
          │                   │
          │           ┌───────┴───────┐
          │           ▼               ▼
          │      Información       Imagen
          │      (PubChem)       (PubChem)
          └───────────┴───────────────┘
                      │
                      ▼
                  FAVORITO
                      │
             ┌────────┴────────┐
             ▼                 ▼
         ★ 4 de 5         Nota 0–200
```

**El detalle alimenta el historial** — solo el detalle, no la búsqueda ni las combinaciones (SPEC 11 §1).

**La combinación identificada alimenta el progreso** — solo la primera vez por compuesto (SPEC 12 §1).

---

## 9. Estado final esperado

ChemLab debe presentarse como una aplicación web móvil completa y coherente, no como una colección de ejemplos aislados. La experiencia debe sostenerse desde el ingreso hasta la instalación como PWA, pasando por exploración, búsqueda, selección, experimentación, resultado, valoración, favoritos, historial, descubrimientos, navegación y uso offline.

El diseño visual está definido en `design-import/` y se implementa respetando la arquitectura de pantallas aprobada, con los desvíos registrados en cada SPEC y consolidados en `design-import/CORRECCIONES.md`.
