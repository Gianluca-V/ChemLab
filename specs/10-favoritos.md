# SPEC 10 — Favoritos

**Estado:** aprobado
**Depende de:** SPEC 00, SPEC 02, SPEC 06
**Fuentes:** descripción §6.3, §18, §19, RF5; diseño frames 12, 13, 14, 15, 20, 23, 24
**Componentes:** `FavoritesView.vue`, `FavoriteDialog.vue`, `StarRating.vue`, `NoteCounter.vue`, `ConfirmSheet.vue`

---

## 1. Vocabulario

> **Contradicción #8, resuelta.** El diseño llama "nota" a las estrellas y "mensaje" al texto; la descripción §6.3 llama `rating` a las estrellas y `note` al texto. La palabra "nota" significaba dos cosas opuestas según el documento.
>
> Se adopta el modelo de la descripción y se reetiquetan las pantallas para que coincidan.

| Concepto | Campo | Etiqueta en UI |
|---|---|---|
| Estrellas 1–5, obligatorio | `rating` | **Valoración** |
| Texto de hasta 200 caracteres, opcional | `note` | **Nota** |

### Copy afectado

| Frame | Antes | Ahora |
|---|---|---|
| 12, 13, 14 | `Tu nota *` | `Valoración *` |
| 12, 13, 14 | `Mensaje corto` | `Nota` |
| 12, 13 | `Sin nota` (acción) | `Sin valoración` |
| 13 | `Tenés que elegir una nota de 1 a 5 estrellas.` | `Tenés que elegir una valoración de 1 a 5 estrellas.` |
| 20 | `…quedará acá, con tu nota y tu mensaje.` | `…quedará acá, con tu valoración y tu nota.` |

El resto de los 28 frames no cambia.

---

## 2. Modelo

```json
{
  "id": "H2O",
  "type": "compound",
  "name": "Agua",
  "formula": "H2O",
  "rating": 4,
  "note": "El primer compuesto que armé sin ayuda de la tabla.",
  "createdAt": "2026-08-30T14:21:00.000Z",
  "updatedAt": "2026-08-30T14:21:00.000Z"
}
```

- `id`: `symbol` para elementos, `formula` para compuestos.
- `type`: `element` o `compound`. Junto a `id` forma la clave única.
- `formula` es `null` en elementos.
- `name` y `formula` se **copian** al favorito. Así la lista se renderiza sin cruzar contra los datasets, y un favorito sigue siendo legible aunque su entrada desaparezca del dataset.
- `createdAt` fija el orden de la lista. `updatedAt` cambia al editar.

**Un favorito por par `(type, id)`.** Marcar dos veces el mismo ítem abre el diálogo en modo edición, no crea un duplicado.

Persiste en `chemlab_favorites` vía `useFavorites()`, en cada mutación (SPEC 00 §4).

---

## 3. `FavoriteDialog` — frames 12, 13, 14

`<dialog>` nativo, con `showModal()`. Aporta gratis el backdrop, el atrapado del foco, el cierre con Escape y la inertización del fondo. No se reimplementa nada de eso.

```
┌────────────────────────────────┐
│  H₂O    Añadir a favoritos     │
│  Agua · compuesto              │
│                                │
│  Valoración *      ★★★★☆  4/5  │
│                    Sin valoración
│                                │
│  Nota                 Opcional │
│  ┌──────────────────────────┐  │
│  │ El primer compuesto que  │  │
│  │ armé sin ayuda…         │  │
│  └──────────────────────────┘  │
│                       49 / 200 │
│                                │
│  [ Cancelar ]     [ Guardar ]  │
└────────────────────────────────┘
```

### Modos

| Modo | Disparador | Encabezado | Botón |
|---|---|---|---|
| Alta | `☆` en un ítem no marcado | `Añadir a favoritos` | `Guardar` |
| Edición | `★` en un ítem ya marcado, o tocar una tarjeta en `/favorites` | `Editar favorito` | `Guardar cambios` |

En modo edición, el diálogo abre con `rating` y `note` cargados.

`Cancelar` y Escape descartan sin persistir. No se pide confirmación al descartar: no hay nada que perder salvo lo tipeado en esa sesión del diálogo.

---

## 4. `StarRating`

Cinco estrellas, valor entero de 1 a 5, **obligatorio**.

```html
<div role="radiogroup" aria-labelledby="rating-label" aria-required="true">
  <button role="radio" aria-checked="false" aria-label="1 de 5" tabindex="-1">★</button>
  …
  <button role="radio" aria-checked="true"  aria-label="4 de 5" tabindex="0">★</button>
  …
</div>
```

Es un `radiogroup`, no cinco interruptores independientes. El documento de diseño lo especifica en su tarjeta de accesibilidad y tiene razón: cinco `checkbox` se anunciarían como cinco controles separados, cuando lo que hay es **una** valoración con cinco valores posibles.

- **Tabindex móvil (roving):** solo la estrella seleccionada tiene `tabindex="0"`. El grupo entero es una parada de tabulación.
- Flechas izquierda/derecha mueven la selección. Home y End van a 1 y 5.
- Cada estrella mide 44 px.
- Junto a las estrellas se muestra el conteo `4 / 5` en texto. **El color y el relleno no son el único portador del valor**, según el criterio del diseño.

### `Sin valoración`

Acción en línea de 36 px, junto a las estrellas. Devuelve `rating` a `null`, con la etiqueta visible `Sin elegir` (frame 13).

Sirve para deshacer un toque accidental antes de guardar. Como `rating` es obligatorio, dejarlo en `null` bloquea el guardado: la acción no permite guardar un favorito sin valoración, solo corregir el camino hacia ella.

> La crítica del diseño anotó que no había forma de limpiar una valoración. El control existe en el frame 12 bajo la etiqueta "Sin nota"; acá queda especificado su comportamiento y renombrado según §1.

---

## 5. Nota — el límite de 200

`<textarea>` con `maxlength="200"`.

### Contador

`49 / 200`, actualizado **en tiempo real, en cada tecla**. Descripción §18 lo exige explícitamente.

| Estado | Tratamiento |
|---|---|
| 0–179 | `--text-muted` |
| 180–199 | `--text-2`, para anticipar el límite |
| 200 | `--hazard-text` + nota `Límite de 200 caracteres alcanzado` |

El contador lleva `aria-live="polite"` y se anuncia solo al cruzar 180 y 200. Anunciar cada tecla sería insoportable con lector de pantalla.

### Cómo se cuentan los caracteres

```js
const length = [...text].length;
```

Se cuentan **puntos de código**, no unidades UTF-16. `"🎉".length` es 2 en JavaScript; para el usuario es un carácter. Sin esto, dos emoji consumirían cuatro de los 200 y el contador mentiría.

### Límite duro

Frame 14: *"el maxlength impide seguir escribiendo y el guardado nunca trunca el texto."*

- `maxlength` bloquea la escritura en el navegador.
- **Además** se valida en JavaScript antes de guardar. Descripción §18: *"La validación debe realizarse mediante JavaScript, no únicamente mediante atributos HTML."* Un `maxlength` se saltea desde las herramientas de desarrollo; la validación de JS es la que gobierna.
- Si al guardar el texto supera 200, **se rechaza con un error de validación. Nunca se trunca.** Truncar destruye texto del usuario sin avisar.
- El pegado que excede el límite se recorta al pegar, con el contador marcando 200 y la nota de límite alcanzado.

---

## 6. Validación

Descripción §36: "error de validación" es una categoría propia, provocada por entrada del usuario.

| Regla | Mensaje |
|---|---|
| `rating` presente | `Tenés que elegir una valoración de 1 a 5 estrellas.` |
| `rating` entero entre 1 y 5 | ídem |
| `note` ≤ 200 puntos de código | `La nota no puede superar los 200 caracteres.` |

### Comportamiento — frame 13

- `Guardar` está **habilitado** aunque el formulario sea inválido. Se valida al tocarlo.
- El error aparece bajo la etiqueta del campo, con `role="alert"` e ícono SVG.
- El foco se mueve al primer control inválido.
- El grupo de estrellas recibe `aria-invalid="true"` y `aria-describedby` apuntando al mensaje.
- El mensaje desaparece en cuanto el campo pasa a ser válido.

> Se eligió validar al enviar y no deshabilitar `Guardar` porque un botón deshabilitado no explica qué falta. El frame 13 muestra exactamente ese patrón: botón activo, error visible bajo el campo.
>
> Es lo opuesto al criterio aplicado a `COMBINAR` (SPEC 07 §4), y la diferencia es deliberada: allá la condición es obvia y se enuncia junto al botón; acá el usuario ya invirtió trabajo en el formulario y merece saber qué falta corregir, no un botón mudo.

---

## 7. `FavoritesView` — frame 15

```
Favoritos                          4 guardados
[ Compuestos ]  [ Elementos ]
──────────────────────────────────────────────
 H₂O   Agua                    ★★★★☆  4 / 5
 El primer compuesto que armé sin ayuda…   🗑
──────────────────────────────────────────────
 NaCl  Cloruro de sodio        ★★★★★  5 / 5
 Sal de mesa. Sirve para el TP de enlaces…  🗑
──────────────────────────────────────────────
 CO₂   Dióxido de carbono      ★★★☆☆  3 / 5
                                            🗑
```

### Pestañas

`role="tablist"` con dos `role="tab"`. Cada una muestra su conteo: `Compuestos (3)`, `Elementos (1)`.

La pestaña activa se refleja en la URL como `?tab=elements`, para que el back del navegador funcione y la vista sea compartible. Por defecto, `compounds`.

### Tarjeta

| Zona | Acción |
|---|---|
| Cuerpo | Abre `FavoriteDialog` en modo edición |
| `🗑` | Abre `ConfirmSheet` |

- La valoración se muestra como estrellas **y** como `4 / 5`. El color no es el único portador.
- Una nota vacía no deja hueco: la tarjeta se compacta.
- Notas largas se recortan a 3 líneas con `-webkit-line-clamp`; el texto completo está en el diálogo de edición.
- El orden es por `createdAt` descendente. El más reciente primero.

Descripción §19 pide además "permitir abrir el detalle": la tarjeta lleva una acción secundaria `Ver detalle`, que navega a `/element/:symbol` o `/compound/:formula` según `type`.

---

## 8. Eliminación — frame 23

`ConfirmSheet`, hoja inferior sobre un scrim, **cubriendo la lista sobre la que actúa**. Las filas de favoritos siguen visibles debajo: el usuario ve el contexto de lo que está por borrar.

```
¿Eliminar «Agua» de favoritos?

Se borran la valoración y la nota que escribiste.
La acción no se puede deshacer: los favoritos viven
solo en este navegador.

[ Cancelar ]        [ Eliminar ]
```

- `Eliminar` usa `--hazard`. `Cancelar` es la acción neutra y recibe el foco inicial.
- Ambos botones miden 44 px.
- Escape y tocar el scrim cancelan.
- El texto nombra **qué** se pierde —valoración y nota— y **por qué** es irreversible: los datos viven solo en este navegador. No dice un genérico "¿Estás seguro?".

> La crítica registró que las acciones destructivas del diseño original borraban datos de `localStorage` sin confirmación ni deshacer. El frame 23 lo corrigió y se adopta.

La misma hoja cubre "Vaciar" el historial, cambiando título y conteo (SPEC 11).

---

## 9. Toast de éxito — frame 24

Al guardar un favorito:

```
✓ Guardado en favoritos
  Agua · 4 de 5 estrellas          [ Deshacer ]
```

- Dura 4 segundos, se anuncia por `role="status"` y se puede cerrar antes.
- `Deshacer` mide 36 px.
- En alta, `Deshacer` elimina el favorito recién creado. En edición, restaura los valores previos.

> **Hueco de diseño, cubierto.** La crítica lo marcó como el problema de mayor frecuencia: *"la acción más repetida —★ guardar— no tiene confirmación de éxito en ninguno de los 20 frames"*. El frame 24 lo resuelve y se aplica a toda alta o edición de favorito, junto al cambio de la estrella a su estado lleno (SPEC 06 §4).

Especificación completa del sistema de toasts en SPEC 15.

---

## 10. Estado vacío — frame 20

```
        ☆
   Todavía no guardaste favoritos

   Tocá la estrella en cualquier elemento
   o compuesto y quedará acá, con tu
   valoración y tu nota.

   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
   │  ░░░   ░░░░░░     ★★★★☆   │   ← previsualización fantasma
   │  ░░░░░░░░░░░░░░░░         │
   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

El bloque fantasma previsualiza la tarjeta que va a llenar el espacio. Es una decisión del diseño y se conserva: el estado vacío muestra la forma de lo que falta, en lugar de un cartel plano.

- El fantasma es `aria-hidden="true"`. Es una ilustración, no contenido.
- Se muestra por pestaña: con compuestos guardados y ningún elemento, la pestaña Elementos muestra su propio vacío.
- El encabezado y las pestañas siguen visibles: el vacío ocupa el área de la lista, no la pantalla entera.
