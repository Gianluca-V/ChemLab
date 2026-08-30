# SPEC 07 — Laboratorio y mezcla

**Estado:** aprobado
**Depende de:** SPEC 00, SPEC 02, SPEC 03, SPEC 05, SPEC 06
**Fuentes:** descripción §10.1, RF9; diseño frames 07, 08
**Componentes:** `LabView.vue`, `MixtureRow.vue`, `QuantityStepper.vue`, `MixtureBar.vue`, `EmptyState.vue`

---

## 1. El estado de la mezcla

`useMixture()` es el composable dueño del laboratorio. Su estado es un único objeto:

```js
{ H: 2, O: 1 }
```

Mismo shape que el campo `elements` de un compuesto (SPEC 02 §5). Se pasa directo a `hillKey()` sin transformación intermedia.

**Persiste a `chemlab_mixture` en cada mutación**, según la regla de SPEC 00 §4. La mezcla sobrevive a la navegación, a la recarga y al cierre del navegador. Esto es lo que hace posible el mensaje del frame 22: *"Tu mezcla H₂O sigue guardada; volvé a intentar cuando tengas señal."*

### API

| Función | Efecto |
|---|---|
| `add(symbol)` | +1 átomo. Crea la entrada si no existe |
| `setQuantity(symbol, n)` | Fija la cantidad. `n === 0` elimina la entrada |
| `remove(symbol)` | Elimina la entrada completa |
| `clear()` | Vacía la mezcla |
| `totalAtoms` | `computed`. Suma de todas las cantidades |
| `elementCount` | `computed`. Cantidad de entradas |
| `tentativeKey` | `computed`. `hillKey(state)` |

### Límites

| Límite | Valor | Comportamiento al alcanzarlo |
|---|---|---|
| Cantidad por elemento | 20 | El `+` se deshabilita con `aria-disabled="true"` |
| Átomos totales | 50 | Todo `+` se deshabilita; se muestra `Límite de 50 átomos alcanzado` |

> **Hueco de diseño, cubierto.** La crítica registró que no hay comportamiento definido al superar límites en ningún control. Ningún compuesto del dataset pasa de 9 átomos —el mayor es C₂H₅OH—, así que los topes no restringen ningún caso legítimo. Existen para que el estado no pueda volverse absurdo y para que el `+` nunca sea un botón sin efecto.

---

## 2. Estado vacío — frame 07

```
        ⚗
   Tu mezcla está vacía

   Seleccioná elementos de la
   tabla periódica para comenzar.

   [ Abrir tabla periódica ]
```

Hace las tres cosas que un estado vacío tiene que hacer: nombra la situación, explica el mecanismo en una oración y ofrece la acción que la resuelve, a 52 px de alto.

El botón navega a `/table`. `MixtureBar` no se renderiza. `COMBINAR` y `Limpiar` no se renderizan: no hay nada sobre lo que actuar.

---

## 3. Mezcla cargada — frame 08

```
Tu mezcla                          3 átomos
Fórmula tentativa            H₂O
[H] [H] [O]
─────────────────────────────────────────────
 1   H   Hidrógeno
     🔥 Altamente inflamable      [− 2 +]
─────────────────────────────────────────────
 8   O   Oxígeno
     ⚠️ Oxidante                  [− 1 +]
─────────────────────────────────────────────
El orden de selección no importa: H + O + H y
O + H + H generan la misma combinación normalizada.

          [ COMBINAR ]
          [ Limpiar ]
```

### Fórmula tentativa

Es `hillKey(mixture)` renderizada con subíndices `<sub>`.

> **Consecuencia visible de la notación de Hill.** Para una mezcla de Na y Cl, la fórmula tentativa muestra `ClNa`, no `NaCl`. Es correcto: `ClNa` es exactamente la clave que el motor va a buscar en el índice.
>
> Se muestra la clave canónica y no una forma embellecida porque la pantalla está mostrando el trabajo del normalizador. Es la misma idea que la nota inmediatamente debajo —"el orden de selección no importa"—: la fórmula tentativa **es** la demostración de que la normalización ocurrió. La fórmula convencional (`NaCl`) aparece en el resultado, cuando hay un compuesto identificado que la aporta.
>
> Se rotula "Fórmula tentativa", no "Fórmula": todavía no hay compuesto identificado.

### Chips de átomos

`[H] [H] [O]` — un chip por átomo, no por elemento. Repiten el símbolo tantas veces como su cantidad. Es la representación literal de la selección, antes de normalizar; junto a la fórmula tentativa muestran las dos caras del mismo dato.

Son de presentación, no interactivos.

### `MixtureRow`

Cada fila lleva: número atómico, símbolo, nombre, tag de peligro cuando `hazard` no es `null`, y el stepper.

El tag de peligro es información de seguridad y viene del dataset (SPEC 02 §1). No se omite por falta de espacio.

### `QuantityStepper`

Tres segmentos: `−`, cantidad, `+`.

- Cada segmento mide 44 px de alto.
- Radios partidos: `11px 0 0 11px` en el `−`, `0 11px 11px 0` en el `+`. El diseño lo especifica y la crítica lo señaló como uno de los tres aciertos del documento: resuelve estequiometría —cantidad, no solo pertenencia— sin inventar un control nuevo.
- `aria-label` por elemento: `Quitar un átomo de hidrógeno` / `Agregar un átomo de hidrógeno`.
- La cantidad se anuncia con `role="status"` al cambiar.
- El `−` en cantidad 1 **elimina la fila**. No baja a 0 dejando una fila fantasma. Su `aria-label` cambia a `Quitar el hidrógeno de la mezcla`.
- El `+` se deshabilita en 20 o al alcanzar los 50 átomos totales.

---

## 4. COMBINAR

**Se habilita con 2 o más átomos totales.** Se cuentan átomos, no filas.

| Mezcla | Σ átomos | `COMBINAR` |
|---|---|---|
| vacía | 0 | no se renderiza |
| `O` | 1 | deshabilitado |
| `O × 2` | 2 | habilitado → O₂ |
| `H × 2` | 2 | habilitado → H₂ |
| `N × 2` | 2 | habilitado → N₂ |
| `H × 2 + O` | 3 | habilitado → H₂O |
| `Xe × 2 + Fe` | 3 | habilitado → sin registro |

> **Por qué átomos y no elementos distintos.** Exigir dos elementos químicos diferentes es la lectura intuitiva de "combinar", pero dejaría a O₂, H₂ y N₂ fuera del alcance del laboratorio, y los tres están en la lista de compuestos obligatorios de la descripción §6.2. Con esa regla el contador de descubrimientos jamás podría llegar a 30/30.
>
> Un átomo aislado sí queda bloqueado: no es un compuesto, y dejarlo pasar produciría una pantalla de fracaso evitable además de enseñar mal.

### Estado deshabilitado

```html
<button class="btn" :aria-disabled="totalAtoms < 2">COMBINAR</button>
```

Con `opacity: .45` y `cursor: not-allowed`, según el bloque `.btn[aria-disabled="true"]` del documento de diseño. Junto al botón, un texto explica por qué: `Agregá al menos 2 átomos para combinar`.

> **Hueco de diseño, cubierto.** La crítica lo registró: *"COMBINAR no tiene estado deshabilitado para una mezcla vacía"*, y de forma más general, *"no hay estados deshabilitados en ninguna parte"* de los 20 frames.

Se usa `aria-disabled` y no `disabled`: un botón con `disabled` sale del orden de tabulación y no puede recibir foco, con lo que un usuario de teclado no llega nunca al texto que explica por qué está bloqueado. El `@click` verifica la condición y retorna sin efecto.

`COMBINAR` navega a `/lab/result`. El motor y sus estados se especifican en SPEC 08 y SPEC 09.

---

## 5. Limpiar

Vacía la mezcla completa.

**No abre hoja de confirmación.** Ejecuta, y muestra el toast con acción `Deshacer` durante 4 segundos (frame 24, SPEC 15).

> **Divergencia deliberada respecto de las otras acciones destructivas.** Eliminar un favorito y vaciar el historial sí abren la hoja de confirmación del frame 23 (SPEC 10, SPEC 11), porque destruyen datos que el usuario escribió —una valoración, un mensaje— y que no puede reconstruir.
>
> La mezcla es un estado de trabajo, se rehace en tres toques, y limpiarla es una acción frecuente. Interponer una hoja modal en el flujo más repetido del laboratorio es fricción sin beneficio. Deshacer cubre el error real —el toque accidental— mejor que confirmar, porque no le cobra un paso a las veces que sí querías limpiar.

`Deshacer` restaura el objeto exacto que había antes. El snapshot vive en memoria mientras el toast está visible.

`Limpiar` es acción secundaria: mismo peso visual que en el frame 08, debajo de `COMBINAR`.

---

## 6. `MixtureBar` en `TableView`

Barra fija al pie de `/table`, presente solo con mezcla no vacía (SPEC 03 §1).

```
Mezcla actual   H₂O
                        [ Ver mezcla (3) ]
```

- La fórmula es la misma `tentativeKey` con subíndices.
- El contador entre paréntesis son átomos totales, coherente con `3 átomos` del frame 08.
- El botón navega a `/lab`.
- Es la única realimentación de que agregar un elemento tuvo efecto mientras el usuario recorre la tabla, junto con el toast.

---

## 7. Reglas de comunicación científica

La descripción §37 lo exige y el laboratorio es donde más fácil se incumple.

- La pantalla se titula **"Tu mezcla"**, no "Tu reacción". No hay reacción: hay una composición.
- El rótulo es **"Fórmula tentativa"**, no "Producto".
- La nota del frame 08 se conserva textual: *"El orden de selección no importa: H + O + H y O + H + H generan la misma combinación normalizada."* Habla de combinación normalizada, no de reacción química.
- Los tags de peligro describen la propiedad del elemento (`🔥 Altamente inflamable`, `⚠️ Oxidante`), nunca un resultado de mezclarlos.
- En ningún punto la interfaz afirma que juntar esos elementos produzca el compuesto en condiciones reales. La descripción §43 lo marca como límite deliberado del sistema.
