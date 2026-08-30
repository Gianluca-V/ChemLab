# SPEC 11 — Historial

**Estado:** aprobado
**Depende de:** SPEC 00, SPEC 01, SPEC 02, SPEC 06, SPEC 10
**Fuentes:** descripción §6.4, §20, RF6; diseño frames 16, 21, 23
**Componentes:** `HistoryView.vue`, `EmptyState.vue`, `ConfirmSheet.vue`
**Composable:** `useHistory()`

---

## 1. Qué registra

**Únicamente visitas al detalle**, de elementos y de compuestos.

| Evento | ¿Registra? |
|---|---|
| Abrir `/element/:symbol` | **sí** |
| Abrir `/compound/:formula` | **sí** |
| Buscar | no |
| Aplicar filtros | no |
| Recorrer la tabla periódica | no |
| Combinar en el laboratorio | no |
| Ver `/lab/result` | no |

> **Contradicción #2, resuelta.** El frame 21 describe el historial como *"los elementos que visites y las combinaciones que pruebes"*. Se corrige: las combinaciones probadas pertenecen a Descubrimientos (SPEC 12). El historial sigue la definición de la descripción §6.4 y RF6 — solo detalles visitados, de ambos tipos.
>
> Un compuesto descubierto en el laboratorio entra al historial únicamente si el usuario navega a `/compound/:formula` para ver su ficha. Permanecer en `/lab/result` no genera entrada.

El registro lo hace el `router.afterEach` de SPEC 01 §5. Ninguna vista contiene lógica de historial.

---

## 2. Modelo

```json
{ "id": "O", "type": "element" }
```

Sin marca de tiempo.

> **Desvío registrado respecto de la descripción §6.4 y del diseño.**
>
> La descripción define el modelo con `visitedAt` en ISO-8601. El frame 16 muestra encabezados de día (`Hoy`) y una hora por entrada (`{{ h.time }}`), y el frame 21 promete entradas *"agrupados por día"*.
>
> Por decisión del equipo, el historial **no almacena fecha ni hora**. Lo único que se conserva es el orden. En consecuencia:
>
> - No hay agrupación por día. La lista es plana.
> - No se muestra hora por entrada.
> - La copy del frame 21 pierde la frase "agrupados por día".
> - El requisito de la descripción §20 —*"ordenar del más reciente al más antiguo"*— se cumple igual: lo garantiza la posición en el array.
>
> Consecuencia aceptada: no se puede responder "¿qué miré ayer?". El historial responde "¿en qué orden estuve mirando?", que es lo que RF6 pide para volver al detalle.

`id` es `symbol` en elementos y `formula` en compuestos. Junto a `type` identifica la ruta de destino.

Persiste en `chemlab_history` vía `useHistory()`, en cada mutación (SPEC 00 §4).

---

## 3. Orden y deduplicación

El array está ordenado del más reciente al más antiguo. La entrada nueva va al frente.

**Se colapsan solo los duplicados consecutivos.**

```js
function record({ type, id }) {
  const head = state.items[0];
  if (head && head.type === type && head.id === id) return;   // mismo que el anterior: se ignora
  state.items.unshift({ type, id });
  if (state.items.length > 100) state.items.length = 100;
  persist();
}
```

| Secuencia de visitas | Historial resultante |
|---|---|
| `O` `O` `O` | `O` |
| `O` `Fe` `O` | `O` `Fe` `O` |
| `O` `Fe` `Fe` `O` | `O` `Fe` `O` |
| `H2O` `O` `H2O` | `H2O` `O` `H2O` |

Un mismo ítem puede aparecer varias veces en la lista, siempre que entre una aparición y la siguiente haya habido otra cosa. Lo que nunca aparece es la misma entrada dos veces seguidas.

**Por qué solo consecutivos.** Volver con el back del navegador y entrar de nuevo al mismo detalle es la secuencia más común de la aplicación, y produciría filas idénticas pegadas sin aportar nada. En cambio, `O → Fe → O` sí es información: describe un recorrido real, y colapsarla borraría el hecho de que el usuario volvió.

La comparación es solo contra la primera posición. No se recorre el array: la operación es O(1).

### Límite

**100 entradas.** Fijado por el diseño: *"máximo 100 entradas en chemlab_history"*.

Al superarlo se descarta la más antigua, del final del array. Con el colapso de consecutivos, 100 entradas cubren una sesión de exploración larga sin llenarse de repeticiones.

---

## 4. `HistoryView` — frame 16

```
┌────────────────────────────────┐
│ Historial              Vaciar  │
│                                │
│  Oxígeno                       │
│  elemento                      │
│ ─────────────────────────────  │
│  Agua                          │
│  compuesto                     │
│ ─────────────────────────────  │
│  Hierro                        │
│  elemento                      │
│ ─────────────────────────────  │
│  Oxígeno                       │
│  elemento                      │
└────────────────────────────────┘
```

Sin encabezados de día. Lista plana, en orden.

### Fila

| Línea | Contenido |
|---|---|
| Principal | `name` del elemento, o `formula` + `name` del compuesto |
| Secundaria | `elemento` o `compuesto` |

`{{ h.kind }}` del diseño se conserva; `{{ h.time }}` se elimina por falta de dato.

**El nombre se resuelve contra el dataset al renderizar**, a partir de `type` e `id`. A diferencia de los favoritos —que copian `name` y `formula` en la entrada (SPEC 10 §2)—, acá no se copia nada: el historial es de solo lectura, se regenera constantemente y no necesita sobrevivir a un cambio del dataset.

Si un `id` ya no existe en el dataset, la entrada se omite al renderizar y se depura del array en la siguiente escritura. No se muestra una fila rota.

### Interacción

La fila completa es un `<button>` que navega a `/element/:symbol` o `/compound/:formula` según `type`. Cumple la descripción §20: *"permitir volver al detalle."*

**Volver al detalle desde el historial genera una entrada nueva**, salvo que ese ítem ya esté en la primera posición. Es coherente con la regla de consecutivos: si el usuario tocó la cuarta fila, hubo otras visitas en el medio y el recorrido es real.

Altura de fila: 44 px como mínimo.

---

## 5. Vaciar — frame 23

Acción `Vaciar` en el encabezado. Abre la misma `ConfirmSheet` que la eliminación de favoritos, con el título y el conteo cambiados:

```
¿Vaciar el historial?

Se eliminan las 12 entradas de ítems que visitaste.
La acción no se puede deshacer: el historial vive
solo en este navegador.

[ Cancelar ]        [ Vaciar ]
```

- El conteo es real, no un texto fijo.
- `Vaciar` usa `--hazard`. `Cancelar` recibe el foco inicial.
- Escape y tocar el scrim cancelan.
- La hoja cubre la lista sobre la que actúa, con las filas visibles debajo del scrim.

`Vaciar` queda deshabilitado con el historial vacío. No se renderiza sobre el estado vacío.

> A diferencia de `Limpiar` la mezcla —que ejecuta y ofrece `Deshacer` (SPEC 07 §5)—, vaciar el historial sí confirma: borra hasta 100 entradas de una vez y no hay forma de reconstruirlas.

---

## 6. Estado vacío — frame 21

```
        🕐
   No hay nada en el historial

   Acá van a aparecer los elementos
   y compuestos cuyo detalle visites.

   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
   │  ░░░░░░░░              │   ← previsualización fantasma
   │  ░░░░░░                │
   ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
   │  ░░░░░░░░░░            │
   │  ░░░░░░                │
   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

   [ Explorar la tabla periódica ]
```

> **Copy corregida.** El frame 21 decía: *"Acá van a aparecer los elementos que visites y las combinaciones que pruebes, agrupados por día."* Se corrige por dos motivos ya resueltos: las combinaciones probadas no son historial (§1) y no hay agrupación por día (§2).

- Las filas fantasma previsualizan la forma de la lista, según el patrón del diseño. Son `aria-hidden="true"`.
- El encabezado se conserva sobre el vacío, como en el frame 21.
- La acción primaria navega a `/table`.

---

## 7. Accesibilidad

- La lista es `<ol>`: el orden es significativo, no es un conjunto.
- Cada fila es un `<button>` dentro de su `<li>`, no un `<div>` clickeable.
- `aria-label` de la fila: `Ver el detalle de Oxígeno, elemento`.
- El encabezado anuncia el total: `Historial, 12 entradas`, dentro de un `role="status"` que se actualiza al vaciar.
- Al vaciar, el foco pasa al encabezado del estado vacío. Sin eso, el foco queda huérfano en un botón que dejó de existir.
