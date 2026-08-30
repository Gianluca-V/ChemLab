# SPEC 16 — Responsive y layout

**Estado:** aprobado
**Depende de:** SPEC 01, SPEC 03, SPEC 05, SPEC 07, SPEC 14
**Fuentes:** descripción §24, RF8, RNF1; diseño frames 27, 28 y tarjeta "Breakpoints"
**Componentes:** `App.vue`, `NavDrawer.vue`, `NavSidebar.vue`, `MixturePanel.vue`

---

## 1. Mobile first

Los estilos base se escriben para 390 px. Todo `@media` es `min-width`; no hay ninguna `max-width` en el proyecto.

Consecuencia práctica: el CSS que carga un teléfono es el más corto, y cada breakpoint **agrega**, nunca deshace lo anterior.

---

## 2. Breakpoints

Los cuatro contextos que fija la consigna, transcritos de la descripción §24 y de la tarjeta del diseño.

| Contexto | Ancho | Nav | Panel de mezcla | Resultados/fila | Celda de tabla |
|---|---|---|---|---|---|
| Mobile portrait | ≤480 px | Drawer | no | 1 | 56×64, scroll XY |
| Mobile landscape | 481–767 px | Drawer | no | 2 | 56×64, scroll XY |
| Tablet | 768–1023 px | Drawer | **sí** | 3 | 44×44, scroll X |
| Desktop | ≥1024 px | Sidebar fija | **sí** | 4 | 44×44, sin scroll |

```css
/* base: ≤480 */
@media (min-width: 481px)  { … }
@media (min-width: 768px)  { … }
@media (min-width: 1024px) { … }
```

**Ningún componente escucha `resize`.** Todo el comportamiento responsive es CSS. `PeriodicTable` no recalcula nada al redimensionar: sus dimensiones son custom properties que resuelve el motor de estilos (SPEC 03 §7).

---

## 3. Estructura de `App.vue`

```html
<TopBar />                      <!-- ≤1023 -->
<NavSidebar />                  <!-- ≥1024 -->
<NavDrawer />                   <!-- ≤1023, colapsable -->

<div class="shell">
  <main><RouterView /></main>
  <aside class="lab-panel"><MixturePanel /></aside>   <!-- ≥768 -->
</div>

<ToastHost />
```

```css
.shell { display: block; }
.lab-panel { display: none; }

@media (min-width: 768px) {
  .shell { display: grid; grid-template-columns: 1fr 320px; gap: var(--sp-4); }
  .lab-panel { display: block; }
}
@media (min-width: 1024px) {
  .shell { grid-template-columns: 240px 1fr 360px; }   /* sidebar + main + panel */
}
```

**La aparición del panel es puramente CSS.** No hay guard de router que mire el ancho, no hay `window.innerWidth` en JavaScript. Redimensionar la ventana no puede dejar al usuario en un estado inconsistente.

---

## 4. Panel de mezcla persistente — frames 27 y 28

A partir de 768 px, la mezcla es un `<aside>` visible en **todas** las rutas, no una pantalla aparte.

```
┌────────────────────────────────────────────────┐
│ nav │  <RouterView>            │ <aside>       │
│     │                          │               │
│ Lab │  tabla periódica         │ Resultado     │
│ Ele │  ████████████████████    │   H₂O  Agua   │
│ Des │  ████████████████████    │   CID 962     │
│ Fav │  ████████████████████    │               │
│ His │                          │ Mezcla        │
│ Con │                          │  H  − 2 +     │
│     │                          │  O  − 1 +     │
│     │                          │ [ COMBINAR ]  │
│     │                          │ [ Limpiar ]   │
│     │                          │               │
│     │                          │ Descubiertos  │
│     │                          │   8 / 30      │
└────────────────────────────────────────────────┘
```

### `MixturePanel`

Componente compartido. `LabView` (mobile, frames 07/08) y el `<aside>` (tablet/desktop, frames 27/28) renderizan **el mismo** `MixturePanel`; solo cambia el contenedor.

Se extraen a componentes reutilizables: `MixtureRow`, `QuantityStepper`, el bloque de fórmula tentativa, `COMBINAR` y `Limpiar`. Ninguno se duplica.

Ambos leen `useMixture()`, que ya es un singleton (SPEC 00 §4): agregar un elemento desde la tabla actualiza el panel sin ningún cableado extra.

### La ruta `/lab` sobrevive en todos los anchos

Sigue siendo una URL válida y compartible.

| Ancho | `/lab` renderiza |
|---|---|
| ≤767 px | `LabView` a pantalla completa, con `MixturePanel` dentro |
| ≥768 px | La tabla periódica en el área principal, con el panel ya visible al costado |

En ≥768 px el `<aside>` ya muestra la mezcla, así que el área principal aprovecha el espacio con la tabla en lugar de repetir el panel. No hay redirección: la ruta se resuelve siempre igual, y lo único que cambia es qué componente ocupa el área principal, decidido por una media query, no por JavaScript.

### `MixtureBar`

La barra fija al pie de `/table` (SPEC 03 §1, SPEC 07 §6) **solo existe por debajo de 768 px**. Con el panel lateral visible, duplicaría la información.

```css
.mixture-bar { display: block; }
@media (min-width: 768px) { .mixture-bar { display: none; } }
```

### Bloque de resultado en el panel

Tras `COMBINAR`, en ≥768 px el resultado aparece **dentro del panel**, como en el frame 28, sin abandonar la tabla. En ≤767 px navega a `/lab/result`, como en el frame 10.

El estado de carga, error y caché es el mismo (SPEC 09 §5): cambia el contenedor, no la lógica.

### "Últimos experimentos" — descartado

> El frame 27 incluye en el panel de tablet una lista "Últimos experimentos" (`Na + Cl → NaCl · 14:21`, `C + O + O → CO₂ · 13:44`).
>
> Se descarta. No es historial —el historial son visitas al detalle (SPEC 11 §1)—, no es descubrimientos, ningún RF la exige, requeriría una cuarta clave de persistencia y muestra hora, que se decidió no almacenar (SPEC 11 §2).
>
> En su lugar el panel muestra el bloque de progreso `Descubiertos 8 / 30`, que el mismo frame 27 ya incluye y que sí tiene fuente de datos (SPEC 12).

---

## 5. Navegación

| Ancho | Componente | Comportamiento |
|---|---|---|
| ≤1023 px | `TopBar` + `NavDrawer` | Hamburguesa, drawer sobre scrim, se cierra tras navegar |
| ≥1024 px | `NavSidebar` | Columna fija de 240 px, siempre visible, sin hamburguesa |

Ambos consumen la **misma lista de entradas y los mismos badges** (SPEC 01 §6). La lista se declara una sola vez.

El frame 28 muestra la sidebar de desktop con las seis entradas y el logo arriba. El frame 27 (tablet) conserva la hamburguesa: a 834 px, restar 240 px de sidebar a una tabla que ya necesita scroll horizontal empeora el problema.

---

## 6. La tabla periódica no desborda la aplicación

Descripción §24, terminante: *"La tabla periódica no debe generar overflow horizontal de toda la aplicación. Si el ancho no permite representar adecuadamente la tabla, el overflow debe estar contenido exclusivamente dentro de su propio componente."*

`body` **nunca** scrollea en horizontal, en ningún breakpoint. El contenedor de la grilla lleva su propio `overflow: auto`.

| Ancho | Grilla | Contenedor | Scroll |
|---|---|---|---|
| ≤767 px | 1063 × 620 px | 100 %, alto fijo 408 px | ambos ejes |
| 768–1023 px | 860 × 496 px | 544 px | horizontal |
| ≥1024 px | 860 × 496 px | 890 px | ninguno |

**La "tabla completa sin scroll" recién existe desde 1024 px.** A 834 px la grilla mide 860 px contra 544 px de columna. El documento de diseño lo dice y se respeta: no se promete una tabla completa donde no cabe.

Detalle en SPEC 03 §4.

---

## 7. Mobile landscape

481–767 px. La descripción §24 pide *"mejor aprovechamiento horizontal, paneles reorganizados"*.

- Resultados pasan a 2 columnas.
- La tabla conserva celda de 56×64 y scroll en ambos ejes, pero el contenedor pierde el alto fijo de 408 px: en landscape la altura disponible es la restricción, no el ancho. Usa `max-height: 60vh` redondeado al múltiplo de fila más cercano.
- El drawer y el `<dialog>` de favorito limitan su alto a `90vh` con scroll interno. En 390 px de alto, un diálogo de 500 px no entra.
- `ConfirmSheet` y `ToastHost` siguen anclados al pie.

Ningún frame del diseño cubre landscape. Es un hueco: se deriva de las reglas de la descripción §24 y de los frames de portrait, sin inventar componentes nuevos.

---

## 8. Reglas transversales

- **Unidades relativas** para tipografía y espaciado donde el valor no es una dimensión de componente. Las dimensiones fijas —celda, alto de la tabla, ancho del panel— son píxeles porque son decisiones de diseño, no escalado.
- `img { max-width: 100%; height: auto; }` en `base.css`. La imagen de estructura de PubChem no puede desbordar su tarjeta.
- Bloques anchos —tabla periódica, `<code>` con SMILES e InChIKey— scrollean dentro de su propio contenedor.
- El `<iframe>` del mapa mantiene `aspect-ratio` fijo (SPEC 13 §B.4).
- **Ningún objetivo táctil por debajo de 44 px** en acciones primarias, destructivas y de ícono; 36 px con 8 px de separación en chips y acciones en línea. Es el piso que declara el documento de diseño y se sostiene en los cuatro breakpoints.
