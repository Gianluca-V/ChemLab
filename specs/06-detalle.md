# SPEC 06 — Detalle de elemento y de compuesto

**Estado:** aprobado
**Depende de:** SPEC 01, SPEC 02, SPEC 05
**Fuentes:** descripción §17, RF4; diseño frames 06, 10
**Componentes:** `ElementDetailView.vue`, `CompoundDetailView.vue`, `CompoundInfo.vue`, `FavoriteStar.vue`

---

## 1. Dos vistas, un patrón

| | `ElementDetailView` | `CompoundDetailView` |
|---|---|---|
| Ruta | `/element/:symbol` | `/compound/:formula` |
| Frame | 06 | 10 (ficha) |
| Fuente | `elements.json` local | `compounds.json` + PubChem |
| Carga | Síncrona. Sin estado de loading | Asíncrona. Loading, error y offline |
| Acción primaria | Añadir al laboratorio | Añadir al laboratorio |
| Favorito | Estrella en `TopBar` | Estrella en `TopBar` |

El detalle de elemento **no tiene estado de carga**. El dataset ya está en memoria cuando la vista se monta; pintar un skeleton para un lookup en un `Map` es simular latencia que no existe.

---

## 2. `ElementDetailView` — frame 06

```
TopBar     ‹  Oxígeno                    ☆   ≡
───────────────────────────────────────────────
Identidad   8    O    15.999
            Oxígeno
            No metal · Grupo 16 · Período 2
            ⚠️ Oxidante        Gas
───────────────────────────────────────────────
Propiedades Configuración      1s² 2s² 2p⁴
            Electronegatividad 3.44
            Fusión             −218.79 °C
            Ebullición         −182.95 °C
            Densidad           1.429 g/L
            Oxidación          −2, −1
───────────────────────────────────────────────
Glosario    Qué significan estas propiedades
            La electronegatividad 3.44 indica…
───────────────────────────────────────────────
            [ Añadir al laboratorio ]
```

### Reglas de renderizado

- **`null` se pinta como `—`.** Nunca `0`, nunca `null`, nunca celda vacía. Un guión declara "no disponible"; una celda vacía parece un error de la aplicación. La regla de SPEC 02 §1 se hace visible acá.
- **Lantánidos y actínidos** tienen `group: null`: la línea de identidad pasa de `No metal · Grupo 16 · Período 2` a `Lantánido · Período 6`. No se imprime "Grupo —".
- **`hazard` es `null` en la mayoría de los elementos.** El tag no se renderiza; no queda un hueco reservado.
- **`glossary` es `null` en la mayoría.** El bloque completo se omite, con su encabezado.
- `oxidationStates` vacío se muestra como `—`.

### El bloque de glosario

Es el bloque "Qué significan estas propiedades" del frame 06. Lee causalmente el dato que está arriba: electronegatividad 3.44 → atrae electrones → enlaces polares → oxidante → favorece la combustión sin ser combustible.

Se conserva íntegro y con su encabezado. No es texto decorativo: es la única pieza de los 28 frames que enseña en lugar de listar, y cumple directamente con la descripción §37 —comunicación científica correcta, sin afirmar que el O₂ sea combustible—.

### Añadir al laboratorio

- Agrega 1 átomo del elemento a `useMixture()`.
- Dispara el toast de confirmación (SPEC 15).
- **No navega.** El usuario permanece en el detalle; volver es un solo gesto de back, que además restaura la posición de scroll de la tabla (SPEC 01 §7).
- Si el elemento ya está en la mezcla, incrementa la cantidad y la etiqueta pasa a `Añadir otro · en la mezcla (2)`.

### Botón de volver

`‹` en el `TopBar`, 44 px. Ejecuta `router.back()` cuando existe historial de navegación dentro de la aplicación; en su defecto —entrada directa por URL pegada— navega a `/table`.

Cumple la descripción §17: *"botón para volver al listado correspondiente."*

---

## 3. `CompoundDetailView` y `ResultView` comparten `CompoundInfo`

La ficha de compuesto del frame 10 aparece en dos rutas distintas. Se extrae a un componente único; las dos vistas son envoltorios delgados que cambian solo el marco.

```
CompoundInfo  ← componente compartido
├── fórmula con subíndices · nombre
├── imagen de estructura molecular   ← PubChem, lazy, con placeholder
├── Masa molecular · CID · SMILES · InChIKey   ← PubChem, atribuido
└── Descripción                       ← dato interno de ChemLab
```

| | `CompoundDetailView` (`/compound/:formula`) | `ResultView` (`/lab/result`) |
|---|---|---|
| Origen | Favoritos, historial, descubrimientos | Combinar en el laboratorio |
| Banner de descubrimiento | no | sí, cuando es la primera vez |
| Acciones | `TopBar`: ‹ y ☆ | Al pie: `[Volver a la mezcla]` `[Favorito]` |
| Registra historial | sí | no |

> **Por qué `ResultView` conserva el favorito al pie.** No es una vista de detalle: es el resultado de una acción, y su acción hermana —"Volver a la mezcla"— tiene que estar al mismo nivel visual. El frame 10 las dibuja como par y se respeta. La estrella del `TopBar` es el patrón de las **vistas de detalle**; `ResultView` no es una.

### Separación de fuentes al renderizar

La descripción §6.2 exige distinguir el dato interno del externo. `CompoundInfo` lo hace visible:

- `Descripción` — sin atribución. Es contenido de ChemLab.
- `Masa molecular`, `CID`, `SMILES`, `InChIKey`, imagen — agrupados bajo la atribución `PubChem`, tal como el frame 10 rotula `estructura molecular · PubChem CID 962`.

Si PubChem no responde, el bloque atribuido se reemplaza por el estado de error parcial del frame 11 —*"No pudimos obtener información adicional. Los datos básicos siguen disponibles."*— y la ficha conserva fórmula, nombre, composición y descripción. Los estados de carga, error y caché se especifican en SPEC 09.

### Imagen de estructura

`loading="lazy"`, con `alt` descriptivo (`Estructura molecular del agua`) y un placeholder si la carga falla. Nunca `alt=""`: la imagen porta información química, no es decorativa.

### Parámetro inválido

`:formula` que no existe en `compounds.json` muestra el estado "sin compuesto registrado" del frame 11 dentro de la vista. **No redirige a `not-found`**: la ruta es válida, el recurso no existe (SPEC 01 §3).

---

## 4. La estrella de favorito

Componente `FavoriteStar`, en el `TopBar` de ambas vistas de detalle. 44×44 px.

### Estados

| Estado | Ícono | `aria-label` | Acción al tocar |
|---|---|---|---|
| No es favorito | `☆` contorno, color `--mark-off` | `Añadir Oxígeno a favoritos` | Abre `FavoriteDialog` en modo alta |
| Es favorito | `★` relleno, color `--star-on` | `Editar tu favorito Oxígeno, 4 de 5 estrellas` | Abre `FavoriteDialog` en modo edición |

> **Hueco de diseño, cubierto.** La crítica del documento de diseño lo registró: *"la acción más repetida —★ guardar— no tiene confirmación de éxito en ninguno de los 20 frames; no existe estado de estrella llena en ninguna parte."*
>
> Se especifica acá el estado lleno, y el toast de confirmación del frame 24 se dispara al guardar (SPEC 15). Sin ambos, el usuario no tiene forma de saber si la acción tuvo efecto.

**El color no es el único portador del estado.** El contorno y el relleno difieren en forma, y el `aria-label` enuncia el estado en palabras.

El estado se lee de `useFavorites()`, que es reactivo: marcar un favorito desde el diálogo actualiza la estrella sin que la vista intervenga.

Las reglas del diálogo —valoración obligatoria de 1 a 5, mensaje de hasta 200 caracteres, validación— se especifican en SPEC 10.

---

## 5. Registro en el historial

Ninguna de las dos vistas contiene lógica de historial. El registro lo hace el `router.afterEach` de SPEC 01 §5, para las rutas `element` y `compound`.

Esto significa que la visita se registra también cuando se entra por URL pegada, por back/forward o desde el propio historial. Cumple la descripción §17: *"El acceso al detalle debe registrar automáticamente el ítem en el historial."*

`ResultView` **no** registra: permanecer en `/lab/result` no es visitar un detalle (SPEC 01 §5).

---

## 6. Accesibilidad

- El bloque de identidad es un `<header>` dentro de un `<article>`.
- Las propiedades van en una `<dl>` con `<dt>`/`<dd>`, no en una tabla de layout: son pares nombre-valor, no datos tabulares.
- El glosario es un `<section>` con su `<h2>`.
- La fórmula usa `<sub>` real para los subíndices; el `aria-label` del contenedor la enuncia en palabras (`H 2 O, agua`) para que un lector de pantalla no lea "hache dos o".
- Los superíndices de la configuración electrónica ya vienen como caracteres Unicode en el dataset y se leen correctamente.
- La estrella y el botón de volver miden 44 px, según el piso que fija el documento de diseño.
