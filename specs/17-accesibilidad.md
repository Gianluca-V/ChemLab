# SPEC 17 — Accesibilidad

**Estado:** aprobado
**Depende de:** todas las SPECs de vista
**Fuentes:** descripción §25, RNF7; tarjeta de accesibilidad del documento de diseño
**Alcance:** transversal. Ninguna SPEC de vista puede contradecir esta.

---

## 1. Punto de partida

La tarjeta de accesibilidad del documento de diseño es la parte más trabajada del documento y se adopta como contrato: controles reales, 44 px de piso táctil, `role="radiogroup"` en la valoración, `aria-pressed` en los chips, `aria-current` en la paginación, foco visible de 2 px, contraste medido en ambos temas y el color nunca como único portador.

**Con una salvedad, que la crítica verificó contra el marcado:**

> Tres de las cuatro afirmaciones de esa tarjeta son contradichas por el marcado que tiene inmediatamente arriba. El frame 03 renderiza las 118 celdas de la tabla como `<div>`; los chips de filtro son `<span>`; los cuatro desplegables de búsqueda son `<div>` con un glifo "▾". Son elementos no interactivos que parecen interactivos.
>
> El chequeo automático los declaró en cero porque solo detecta `<div>` que **declaran** `cursor: pointer`, y estos no lo declaran. Es un punto ciego del detector, no una aprobación.

Esta SPEC vale sobre el marcado, no sobre la tarjeta. Donde el diseño promete algo que su propio marcado no cumple, manda lo prometido.

---

## 2. Todo control es un control real

**Regla sin excepciones:** si algo se puede tocar, es un `<button>`, `<a>`, `<input>`, `<select>` o `<textarea>`. Nunca un `<div>` ni un `<span>` con un manejador de eventos.

| Elemento | Marcado | Corrige |
|---|---|---|
| Celda de la tabla | `<button type="button">` | `<div>` del frame 03 |
| Chip de filtro | `<button aria-pressed>` | `<span>` del frame 03/04 |
| Grupo y período | `<select>` con `<label>` | `<div>` con "▾" del frame 04 |
| Campo de búsqueda | `<input type="search">` con `<label>` | placeholder como única etiqueta |
| Fila de resultado | `<button>` + `<button>` hermanos | — |
| Fila de historial | `<button>` dentro de `<li>` | — |
| Estrella de valoración | `<button role="radio">` | — |
| Enlaces de contacto | `<a href="mailto:">` / `tel:` | — |
| Navegación | `<RouterLink>` → `<a href>` | — |

Un `<div>` clickeable no recibe foco, no responde a Enter ni Espacio, no se anuncia como control y no aparece en la lista de controles de un lector de pantalla. No es un detalle estético: es la diferencia entre poder usar la aplicación y no poder.

**La tarjeta bloqueada de Descubrimientos es la excepción correcta**: no es interactiva, así que **no** es un botón (SPEC 12 §4).

---

## 3. Objetivos táctiles

| Tipo de control | Mínimo |
|---|---|
| Acción primaria, destructiva, de ícono | **44 px** |
| Chip de filtro, acción en línea (`Deshacer`, `Sin valoración`) | **36 px**, con 8 px de separación |
| Celda de la tabla | 56×64 px (mobile), 44×44 px (≥768) |

**Ningún control por debajo de 36 px.** Es el piso del documento de diseño y se sostiene en los cuatro breakpoints (SPEC 16 §8).

Esta regla es la que descartó dos alternativas de interacción: un botón "+" dentro de la celda de 56×64 (SPEC 03 §6) y un segundo objetivo táctil dentro de la misma celda. No entraban sin bajar de 44 px.

---

## 4. Foco

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: inherit;
}
```

- `:focus-visible`, no `:focus`: sin anillo tras un clic de mouse, con anillo en navegación por teclado.
- **Nunca `outline: none`** sin un reemplazo visible.
- El anillo usa el acento, que tiene contraste suficiente sobre todas las superficies en ambos temas.

### Gestión del foco

La tabla de transiciones de SPEC 15 §8 es obligatoria. Resumen: al abrir un `<dialog>` el foco va al primer control seguro; al cerrarlo, vuelve al control que lo abrió; al desaparecer contenido —vaciar historial, borrar el último favorito— el foco va al encabezado del estado vacío.

Un foco huérfano manda al usuario de teclado de vuelta a `<body>` y lo obliga a recorrer la página entera otra vez.

### Orden de tabulación

Es el orden del DOM. **No se usa `tabindex` positivo en ningún lugar.**

Único uso de `tabindex`: el patrón de tabindex móvil del `radiogroup` de valoración, donde la estrella seleccionada tiene `0` y el resto `-1` (SPEC 10 §4).

---

## 5. Teclado

| Componente | Teclas |
|---|---|
| `StarRating` | ← → mueven la selección; Home / End van a 1 y 5; el grupo es una sola parada de tabulación |
| `QuantityStepper` | Tab entre `−` y `+`; Enter / Espacio activan |
| `<dialog>` | Escape cierra; el foco queda atrapado dentro (nativo) |
| `ConfirmSheet` | Escape cancela; el foco inicia en `Cancelar` |
| `NavDrawer` | Escape cierra y devuelve el foco a la hamburguesa |
| `CategoryLegend` | `<summary>` nativo: Enter / Espacio expanden |
| `PeriodicTable` | Tab recorre las celdas en orden de DOM (número atómico) |
| Paginación | Tab entre controles; los extremos deshabilitados se saltan |

Toda funcionalidad es alcanzable sin puntero. No hay gestos exclusivos: no hay swipe requerido, no hay pulsación larga como única vía.

---

## 6. Nombres accesibles

| Control | `aria-label` |
|---|---|
| Celda | `Oxígeno, símbolo O, número atómico 8, No metal` |
| Chip de filtro | texto visible + `aria-pressed` |
| Quitar filtro | `Quitar el filtro No metales` |
| Botón `+` de resultado | `Añadir Oxígeno al laboratorio` |
| Stepper | `Agregar un átomo de hidrógeno` / `Quitar un átomo de hidrógeno` |
| Stepper en cantidad 1 | `Quitar el hidrógeno de la mezcla` |
| Estrella | `4 de 5` |
| Favorito vacío | `Añadir Oxígeno a favoritos` |
| Favorito lleno | `Editar tu favorito Oxígeno, 4 de 5 estrellas` |
| Fila de historial | `Ver el detalle de Oxígeno, elemento` |
| Tarjeta bloqueada | `Compuesto sin descubrir, 3 átomos` |
| Paginación | `Ir a la página 7`; la actual con `aria-current="page"` |
| `<iframe>` del mapa | `title="Mapa de la Universidad Nacional Arturo Jauretche"` |

**Ningún control sin texto queda sin etiqueta.** El documento de diseño acredita 44 `aria-label` sobre 70 botones y 13 enlaces, sin controles sin nombre; se sostiene ese estándar.

Los íconos decorativos —✉ ☎ 📍 junto a texto, el asa de la hoja, el fantasma de los estados vacíos— llevan `aria-hidden="true"`.

---

## 7. El color nunca es el único portador

| Información | Portador visual | Portador redundante |
|---|---|---|
| Categoría química | hue de la celda | `aria-label` + leyenda + texto en el detalle |
| Valoración | estrellas rellenas | texto `4 / 5` |
| Estado de favorito | ☆ contorno / ★ relleno | forma distinta + `aria-label` |
| Progreso | barra | texto `8 / 30` |
| Error | color `--hazard` | ícono SVG + `role="alert"` |
| Peligro | tag rojo | texto `Oxidante` / `Altamente inflamable` |
| Celda atenuada por filtro | `opacity: .35` | sigue siendo focusable y activable |

Los diez hues de categoría son el caso más delicado: sin la leyenda, diez tonos no comunican nada. Por eso la leyenda existe en **todos** los breakpoints (SPEC 03 §5), corrigiendo su ausencia en los frames de 390 px.

---

## 8. Contraste

Objetivo: **4.5:1 mínimo para todo texto**, en ambos temas.

La rampa de texto del documento de diseño viene con su contraste medido sobre `--surface-1` y se transcribe con esas anotaciones (SPEC 14 §2). El piso es `--text-muted` a 5.6:1 en oscuro.

Sobre rellenos teñidos —la celda de la tabla, los tags de peligro— el diseño acredita `--text-2` a 8.7:1 y `--text-3` a 5.6:1.

**Tamaño mínimo de texto: 11 px**, en toda la aplicación. Eso obligó a corregir el número atómico (8 px) y el nombre (6 px) de la celda de la tabla, que estaban por debajo del piso que el propio documento declara (SPEC 14 §3).

---

## 9. Estructura semántica

Descripción §25.

```html
<header>   TopBar
<nav>      NavDrawer / NavSidebar, con aria-label
<main>     RouterView — uno solo por página
<aside>    panel de mezcla (≥768)
<section>  bloques con encabezado propio
<article>  ficha de elemento o compuesto
<footer>   pie
```

- **Un solo `<h1>` por vista**, el título de la vista. Las secciones usan `<h2>`. No se saltean niveles.
- Las propiedades del detalle van en `<dl>`/`<dt>`/`<dd>`: son pares nombre-valor, no datos tabulares.
- El historial es `<ol>`: el orden es significativo.
- Favoritos y resultados son `<ul>`.
- La tabla periódica **no** es una `<table>`: es una grilla posicional de controles, no datos tabulares con encabezados de fila y columna. Es un contenedor con `role="grid"` implícito por su uso, y cada celda es un botón autodescriptivo.

### Enlace de salto

`<a href="#main" class="skip-link">Saltar al contenido</a>`, primer elemento focusable del documento, visible solo al recibir foco. Sin él, cada navegación por teclado empieza recorriendo las siete entradas de la navegación.

Ningún frame lo dibuja. Es un hueco de diseño.

---

## 10. Anuncios dinámicos

| Cambio | Mecanismo |
|---|---|
| Contador de resultados tras el debounce | `role="status"` |
| Cambio de página | `role="status"` con `Mostrando 11–20 de 118` |
| Cantidad del stepper | `role="status"` |
| Contador de caracteres | `aria-live="polite"`, solo al cruzar 180 y 200 |
| Toast | `role="status"` |
| Error de validación | `role="alert"` |
| Error de red | `role="alert"` |
| Skeleton | `aria-busy="true"` + `role="status"` |
| Banner de descubrimiento | `role="status"` |

`status` para lo que informa, `alert` para lo que interrumpe. El contador de caracteres no se anuncia en cada tecla: sería insoportable.

---

## 11. Imágenes

- La imagen de estructura molecular lleva `alt` descriptivo: `Estructura molecular del agua`. **Nunca `alt=""`**: porta información química.
- Si falla la carga, se muestra un placeholder con texto, no un ícono roto.
- Los íconos de la interfaz son SVG en línea con `aria-hidden="true"`, acompañados de texto o de `aria-label` en su control.

---

## 12. Movimiento

`prefers-reduced-motion: reduce` desactiva todas las transiciones y animaciones (SPEC 14 §8): botones, celdas, drawer, hoja inferior, toast y el pulso del skeleton.

Ningún frame del diseño lo contempla. Es un hueco: el documento define transiciones sin ofrecer forma de desactivarlas.

---

## 13. Verificación

Antes de la entrega, sobre cada una de las 12 rutas:

1. Recorrer la vista completa **solo con teclado**. Toda acción alcanzable, foco siempre visible.
2. Verificar que no exista ningún `<div>` ni `<span>` con manejador de clic.
3. Confirmar un solo `<h1>` y jerarquía de encabezados sin saltos.
4. Confirmar que todo control sin texto tiene `aria-label`.
5. Medir el contraste de la rampa de texto en ambos temas.
6. Recorrer con lector de pantalla al menos: tabla periódica, valoración por estrellas y hoja de confirmación.
7. Activar `prefers-reduced-motion` y confirmar que no queda movimiento.
