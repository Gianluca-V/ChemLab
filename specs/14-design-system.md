# SPEC 14 — Design system: tokens, escalas y temas

**Estado:** aprobado
**Depende de:** SPEC 00
**Fuentes:** descripción §24, §25, §27, §31, §35; bloque de tokens y tarjeta de accesibilidad del diseño
**Archivos:** `src/assets/css/variables.css`, `src/assets/css/base.css`

---

## 1. Principio

**Ningún componente escribe un literal de color, tamaño, espaciado o radio.** Todo valor visual sale de una custom property declarada en `variables.css`.

Un valor que no está en la escala no se usa. Si un componente necesita uno nuevo, es una decisión de sistema y se agrega a la escala, no al componente.

---

## 2. Tokens de color

Se transcriben del documento de diseño sin reinterpretarlos. El diseño anota el contraste medido de cada paso de la rampa de texto; esas anotaciones se conservan como comentarios.

### Tema oscuro — `:root`

```css
:root {
  color-scheme: dark;

  /* superficies */
  --surface-0:#0c0d11;   /* página / canvas                  */
  --surface-1:#0f1116;   /* fondo del viewport de la app     */
  --surface-2:#12141a;   /* tarjetas, inputs, hojas, celdas  */
  --surface-3:#1a1d24;   /* bloques elevados                 */
  --surface-4:#22252e;   /* segmento activo, chip elegido    */
  --chip-bg:#1c1f26;     /* pill neutro, riel de progreso    */
  --skeleton:#171a20;    /* bloque de carga                  */
  --on-hazard:#1a0c0c;   /* tinta sobre relleno --hazard     */
  --on-star:#1a1608;     /* tinta sobre relleno --star-on    */

  /* bordes */
  --border:#1c1f26;
  --border-2:#1e2129;
  --border-input:#262a34;
  --border-strong:#2a2e38;

  /* rampa de texto — AA sobre --surface-1 en todos los pasos */
  --text-1:#f2f3f7;      /* 17.0:1  títulos, valores         */
  --text-hi:#e2e5ee;     /* 14.5:1  etiquetas de control     */
  --text-2:#c3c7d4;      /* 10.4:1  cuerpo                   */
  --text-3:#9b9fae;      /*  6.9:1  cuerpo secundario        */
  --text-muted:#868b9b;  /*  5.6:1  captions — piso          */
  --mark-off:#7f8595;    /*  5.0:1  estrella vacía, bloqueado*/

  /* marca y estado */
  --accent:oklch(0.72 0.15 300);
  --accent-strong:oklch(0.78 0.15 300);
  --accent-soft:oklch(0.78 0.13 300);
  --accent-border:#2a2340;
  --hazard:oklch(0.72 0.15 25);
  --hazard-text:oklch(0.85 0.1 25);   /* 9.8:1 sobre tinte de peligro */
  --star-on:oklch(0.78 0.14 85);

  /* hues de categoría química */
  --cat-am:25;  --cat-ae:55;  --cat-tm:95;  --cat-pt:145; --cat-ml:185;
  --cat-nm:215; --cat-hl:250; --cat-ng:265; --cat-ln:330; --cat-ac:340;
}
```

### Tema claro — `[data-theme="light"]`

Redefine **solo** los tokens. Ninguna regla de componente se duplica por tema.

```css
[data-theme="light"] {
  color-scheme: light;
  --surface-0:#eeeeea;  --surface-1:#f6f6f4;  --surface-2:#ffffff;
  --surface-3:#efefec;  --surface-4:#e6e6e1;  --chip-bg:#ecece8;
  --skeleton:#e7e7e3;   --on-hazard:#ffffff;  --on-star:#ffffff;

  --border:#e2e2de;  --border-2:#e4e4e0;
  --border-input:#d5d5d0;  --border-strong:#c8c8c2;

  --text-1:#15171c;  --text-hi:#22242b;  --text-2:#3b3e47;
  --text-3:#5c606b;  --text-muted:#62656d;  --mark-off:#6f737c;

  --accent:oklch(0.55 0.16 300);
  --accent-strong:oklch(0.48 0.17 300);
  --accent-soft:oklch(0.5 0.16 300);
  --accent-border:#ddd3ee;
  --hazard:oklch(0.52 0.17 25);
  --hazard-text:oklch(0.42 0.16 25);  /* 7.3:1 */
  --star-on:oklch(0.52 0.14 85);
}
```

Los hues de categoría **no se redefinen**: son ángulos, no colores. La luminosidad y el croma se aplican en el componente.

### Grises casi duplicados

> La crítica midió 39 pares de hex a ≤3 de distancia por canal: `#13151b` / `#14151a` / `#12141a` / `#14161c` conviviendo, `#1c1f26` y `#1c1f27` a Δ=1. Cuatro grises indistinguibles cumpliendo una sola función.
>
> La lista de arriba **es** la consolidación: cinco superficies y cuatro bordes, cada uno con un rol declarado en su comentario. Todo hex del documento de diseño que no figure en esta lista se mapea a su token más cercano. No se agregan grises intermedios.

### Acento y gases nobles

El acento vive en hue 300. El documento de diseño ya desplazó `--cat-ng` de 300 a 265 y `--cat-ac` de 10 a 340 para abrir distancia con el acento y con el rojo de peligro. **Se transcriben desplazados. No se los "corrige" de vuelta.**

---

## 3. Escala tipográfica

7 pasos. Reemplaza los 18 tamaños medidos en el documento.

```css
--fs-1: 11px;   /* caption, meta, número atómico — PISO */
--fs-2: 13px;   /* texto secundario                     */
--fs-3: 15px;   /* cuerpo                               */
--fs-4: 17px;   /* énfasis, símbolo de elemento         */
--fs-5: 20px;   /* título de sección                    */
--fs-6: 24px;   /* título de vista                      */
--fs-7: 30px;   /* hero del Home                        */
```

**11 px es el piso absoluto.** El propio documento de diseño lo declara como mínimo legible en su tarjeta de accesibilidad.

### Consecuencia sobre la celda de la tabla

> El diseño apila en la celda `8px / 17px / 6px` para número atómico, símbolo y nombre. **Dos de los tres están por debajo del piso que el mismo documento fija.**
>
> Corrección: número atómico y nombre pasan a `--fs-1` (11 px), símbolo queda en `--fs-4` (17 px).
>
> Efecto colateral: a 11 px, un nombre largo como "Rutherfordio" no entra en 56 px de ancho. Se trunca con `text-overflow: ellipsis`. El nombre completo sigue disponible en el `aria-label` de la celda (SPEC 03 §3) y en el detalle. Un nombre truncado y legible es mejor que uno completo e ilegible.

### Familias

| Uso | Familia |
|---|---|
| General | `Space Grotesk`, 400/500/600/700 |
| Datos científicos: fórmulas, SMILES, InChIKey, coordenadas, figcaptions | `IBM Plex Mono`, 400/500/600 |

> La crítica reportó `overused-font` ×17 sobre `Space Grotesk`. El propio análisis lo desestima: 16 de las 17 apariciones son la misma decisión repetida por el formato `.dc.html`, que no tiene cascada entre frames. Con una hoja de estilos real, la familia se declara una vez.

El monoespaciado no es decorativo: distingue el dato científico literal del texto de interfaz.

---

## 4. Fuentes autoalojadas

> **Corrección obligatoria del diseño.** El documento carga las fuentes desde Google Fonts con `<link href="https://fonts.googleapis.com/…">`.
>
> Eso es incompatible con el requisito de funcionamiento offline de la descripción §31 y RNF4. Sin conexión, el `<link>` falla, la aplicación cae a la fuente del sistema y la tipografía —parte del diseño evaluado— desaparece. Además introduce una dependencia de red en la ruta crítica del primer render.

Se autoalojan en `public/fonts/`:

- Formato `woff2`, subconjunto latino.
- Solo los pesos usados: Space Grotesk 400/500/600/700, IBM Plex Mono 400/500/600.
- `@font-face` con `font-display: swap`.
- **Precacheadas por el Service Worker** (SPEC 18): la tipografía correcta está disponible desde la primera carga offline.

Elimina toda petición a `fonts.googleapis.com` y `fonts.gstatic.com`, y con ella los dos `<link rel="preconnect">` del documento.

---

## 5. Escala de espaciado

Grilla de 4 px. Reemplaza el 63,3 % de valores fuera de grilla que midió la crítica.

```css
--sp-1:  4px;   --sp-5: 24px;
--sp-2:  8px;   --sp-6: 32px;
--sp-3: 12px;   --sp-7: 48px;
--sp-4: 16px;
```

Todo `margin`, `padding` y `gap` sale de esta escala.

**Excepciones documentadas**, valores calculados que no son espaciado arbitrario:

| Valor | Dónde | Por qué |
|---|---|---|
| 408 px | Alto del viewport de la tabla | 6 filas × 64 + 5 gaps × 4 + 4 (SPEC 03 §4) |
| 8 px | Separador del bloque f | Ya está en grilla |
| 44 px | Piso táctil | Requisito de accesibilidad, no espaciado |
| 56 / 64 px | Celda mobile | Dimensión de componente (SPEC 03) |

---

## 6. Escala de radios

4 pasos. Reemplaza los 20 valores medidos.

```css
--r-sm:   6px;    /* chips, tags de peligro, muestras de color */
--r-md:  11px;    /* celda de tabla, stepper, inputs, botones  */
--r-lg:  16px;    /* tarjetas, diálogos, hojas inferiores      */
--r-full: 999px;  /* pills, barra de progreso, avatar          */
```

`--r-md` conserva los 11 px del stepper del frame 08, incluidos sus radios partidos:

```css
.stepper__minus { border-radius: var(--r-md) 0 0 var(--r-md); }
.stepper__plus  { border-radius: 0 var(--r-md) var(--r-md) 0; }
```

Los siete radios consecutivos entre 9 y 14 px que detectó la crítica colapsan en `--r-md`.

---

## 7. Cambio de tema

`useTheme()` (SPEC 00 §4), persistido en `chemlab_theme`.

### Valores

| Valor | Comportamiento |
|---|---|
| `dark` | Fuerza oscuro |
| `light` | Fuerza claro |
| `system` | Sigue `prefers-color-scheme` |

**Por defecto: `system`.** Sin preferencia guardada, se respeta la del sistema operativo. El oscuro es el tema principal del diseño, pero imponerlo a quien configuró claro es ignorar una preferencia ya expresada.

### Aplicación

`data-theme` se escribe en `<html>`:

```js
document.documentElement.dataset.theme = resolved;  // 'dark' | 'light'
```

Con `system`, se resuelve leyendo `matchMedia('(prefers-color-scheme: dark)')` y se escucha su cambio: alternar el tema del sistema con la app abierta actualiza la interfaz.

### Sin destello inicial

Un script en línea en `index.html`, **antes de cualquier hoja de estilos**, lee `chemlab_theme` y fija `data-theme`. Sin eso, la página pinta un frame en oscuro antes de que Vue monte, y quien eligió claro ve un flash negro en cada carga.

Es la única excepción a la regla de que todo el JavaScript vive en `src/`. Va comentada y son cinco líneas.

`color-scheme` acompaña al tema en ambos bloques: alinea los controles nativos —`<select>`, scrollbars, autocompletado— con el tema de la aplicación.

---

## 8. Estados y superficies del navegador

Transcritos del documento de diseño.

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: inherit;
}
::selection { background: color-mix(in oklch, var(--accent) 38%, transparent); color: var(--text-1); }
input, textarea, [contenteditable] { caret-color: var(--accent); }
* { scrollbar-color: var(--border-strong) transparent; scrollbar-width: thin; }
```

### Estados de componente

```css
.btn { transition: background-color .16s cubic-bezier(.2,.8,.2,1),
                   border-color .16s cubic-bezier(.2,.8,.2,1),
                   opacity .16s; }
.btn:hover  { filter: brightness(1.08); }
.btn:active { filter: brightness(0.94); transform: translateY(1px); }
.btn[aria-disabled="true"],
.btn:disabled { opacity: .45; cursor: not-allowed; filter: none; transform: none; }

.cell { transition: transform .12s cubic-bezier(.2,.8,.2,1), box-shadow .12s; }
.cell:hover { transform: translateY(-1px); }
```

`:focus-visible` y no `:focus`: evita el anillo tras un clic de mouse, lo conserva para navegación por teclado.

### Movimiento reducido

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Ningún frame lo especifica. Es un hueco de diseño: hay transiciones en botones, celdas, drawer, hoja inferior y toast, y todas deben poder desactivarse.

---

## 9. Sombras

Neutras: `rgba(0,0,0,…)`. **Ninguna sombra coloreada.**

> La crítica reportó `dark-glow` en el pin del mapa. El propio análisis lo descarta: la declaración es `box-shadow: 0 0 0 6px color-mix(...)` con radio de desenfoque **0**, es decir un anillo concéntrico sólido —el idioma estándar del pin de mapa—, no un resplandor. Se conserva. Es la única sombra cromática del sistema y está justificada.

---

## 10. Organización de los archivos

| Archivo | Contenido |
|---|---|
| `variables.css` | Solo custom properties. Ninguna regla de selector |
| `base.css` | Reset, `body`, tipografía base, `:focus-visible`, `::selection`, scrollbars, `prefers-reduced-motion` |
| `<style scoped>` de cada componente | Todo lo demás |

**No hay `components.css` global.** Los estilos de componente viven con su componente; el ámbito lo da Vue con `scoped`. Es la ventaja concreta que el framework aporta sobre la estructura de CSS que proponía la descripción §5, y evita el archivo de 26 KB que tenía la implementación previa.

`variables.css` y `base.css` se importan una sola vez, en `main.js`.
