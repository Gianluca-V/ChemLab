# SPEC 08 — Motor de combinación

**Estado:** aprobado
**Depende de:** SPEC 02, SPEC 07
**Fuentes:** descripción §10, §37, §43, RF10; diseño frames 08, 10, 11
**Módulo:** `src/services/chemistry.js`

---

## 1. Qué hace y qué no hace

El motor determina si la composición seleccionada **coincide con un compuesto registrado en el dataset de ChemLab**. Nada más.

Límites deliberados, según descripción §43:

- No simula reacciones químicas.
- No predice productos.
- No calcula termodinámica.
- No balancea ecuaciones.
- No afirma que la mezcla produzca el compuesto en condiciones reales.

Descripción §10.2, textual: *"No se debe inferir una reacción química universal."*

---

## 2. Pureza del módulo

`chemistry.js` es JavaScript plano: no importa `vue`, no toca el DOM, no lee ni escribe `localStorage`, no hace `fetch`. Recibe objetos y devuelve objetos.

Es la pieza más fácil de defender y la única del proyecto que se puede verificar a mano, en papel, sin levantar la aplicación.

---

## 3. Normalización

La mezcla ya llega agrupada por símbolo desde `useMixture()` (SPEC 07 §1), así que los pasos 2 y 3 de la descripción §10.2 —agrupar y contabilizar— están resueltos por la estructura del estado. El motor recibe:

```js
{ H: 2, O: 1 }
```

**El orden de selección es irrelevante por construcción.** `H + O + H`, `H + H + O` y `O + H + H` producen el mismo objeto porque el estado es un mapa de símbolo a cantidad, no una lista. No hay ningún paso que "elimine" el orden: nunca existió.

Es lo que enuncia la nota del frame 08 y lo que exige la descripción §10.1.

---

## 4. `hillKey(composition)`

Implementa la regla determinista del paso 4 de la descripción §10.2.

**Con carbono:** `C`, luego `H` si existe, luego el resto alfabético.
**Sin carbono:** todos los símbolos en orden alfabético, `H` incluido.

La cantidad se anexa al símbolo y **se omite cuando es 1**.

```js
hillKey({ H: 2, O: 1 })          // "H2O"
hillKey({ Na: 1, Cl: 1 })        // "ClNa"
hillKey({ C: 2, H: 6, O: 1 })    // "C2H6O"
hillKey({ C: 1, Ca: 1, O: 3 })   // "CCaO3"
hillKey({ N: 1, H: 3 })          // "H3N"
```

El orden alfabético compara **símbolos completos** con `localeCompare`, no carácter por carácter en ASCII crudo. De eso depende que `C < Ca < Cl` sea correcto y que `CaCO3` produzca `CCaO3`.

Detalles en SPEC 02 §3.

---

## 5. Matching: exacta primero, reducida después

```js
function match(mixture) {
  const exact = hillKey(mixture);
  const hit = byKey.get(exact);
  if (hit) return { status: 'exact', compound: hit, multiplier: 1 };

  const d = gcdOf(Object.values(mixture));
  if (d > 1) {
    const reduced = {};
    for (const [sym, n] of Object.entries(mixture)) reduced[sym] = n / d;
    const rhit = byKey.get(hillKey(reduced));
    if (rhit) return { status: 'multiple', compound: rhit, multiplier: d };
  }

  return { status: 'none', compound: null, multiplier: 0 };
}
```

**El orden no es negociable.** La búsqueda exacta tiene que ir primero, y es lo que mantiene funcionando a los compuestos diatómicos:

| Mezcla | Exacta | MCD | Reducida | Resultado |
|---|---|---|---|---|
| `H×2 + O` | `H2O` ✓ | — | — | Agua, ×1 |
| `H×4 + O×2` | `H4O2` ✗ | 2 | `H2O` ✓ | Agua, ×2 |
| `O×2` | `O2` ✓ | — | — | Oxígeno molecular, ×1 |
| `H×2` | `H2` ✓ | — | — | Hidrógeno molecular, ×1 |
| `N×2` | `N2` ✓ | — | — | Nitrógeno molecular, ×1 |
| `H×2 + O×2` | `H2O2` ✓ | — | — | Peróxido, ×1 |
| `H×4 + O×4` | `H4O4` ✗ | 4 | `HO` ✗ | Sin registro |
| `Xe×2 + Fe` | `FeXe2` ✗ | 1 | — | Sin registro |

Si se redujera siempre, `O×2` daría la clave `O`, y O₂, H₂, N₂ y el peróxido quedarían indescubribles: cuatro entradas del dataset imposibles de alcanzar, y el contador de 30 inalcanzable.

`gcdOf` es el MCD por el algoritmo de Euclides sobre el array de cantidades. Con un solo elemento, el MCD es esa cantidad.

---

## 6. El multiplicador es información, no ruido

Cuando `status === 'multiple'`, `ResultView` muestra el compuesto identificado con una línea adicional:

```
H₂O   Agua
Tu mezcla equivale a 2 unidades de H₂O.
```

Es un momento didáctico: el usuario armó H₄O₂ y el sistema le muestra que la fórmula empírica es H₂O. Se enuncia como equivalencia de composición, nunca como cantidad de moléculas producidas.

**El multiplicador no cambia qué compuesto se identificó.** A efectos de favoritos, descubrimientos e historial, `status: 'multiple'` es idéntico a `status: 'exact'`: se registra el compuesto, una sola vez, por su `key`.

---

## 7. Sin coincidencia — frame 11

```
Xe₂Fe

Sin compuesto registrado

No encontramos un compuesto compatible en la base
de datos de ChemLab para esta combinación.

Probá con una de estas
[ NaCl ]  [ CO₂ ]  [ Fe₂O₃ ]  [ NH₃ ]

[ Editar mezcla ]
```

### El mensaje

Se conserva textual del diseño. Dice **"no encontramos un compuesto compatible en la base de datos de ChemLab"**, no "esta combinación es imposible".

La descripción §10.4 lo exige: *"El mensaje no debe afirmar que la combinación sea químicamente imposible."* La ausencia en un dataset de 30 entradas no dice nada sobre la química del mundo.

### Sugerencias

Hasta 4 compuestos, elegidos así:

1. **Prioridad a los que comparten al menos un elemento con la mezcla fallida.** Para `Xe₂Fe`, `Fe₂O₃` entra por el hierro. Es una pista útil: el usuario ya tiene ese elemento a mano.
2. **Solo compuestos no descubiertos.** Sugerir algo que el usuario ya encontró no aporta nada al progreso.
3. **Si faltan para llegar a 4**, se completa con los no descubiertos de menor cantidad total de átomos: los más fáciles de armar.
4. **Si todo está descubierto**, el bloque no se renderiza.

Orden estable dentro de cada criterio, por `key`. No se aleatoriza: dos fracasos consecutivos con la misma mezcla dan las mismas sugerencias, y una sugerencia que cambia sola parece un error.

Cada chip navega a `/compound/:formula` mostrando su ficha, que registra historial. No precarga la mezcla: el usuario decide.

**Los chips muestran `formula`, no `key`.** Se ve `NaCl`, no `ClNa` (SPEC 02 §2.1).

---

## 8. Disparo del descubrimiento

`status` distinto de `none` con un compuesto no registrado previamente dispara el alta en `useDiscoveries()`.

- Se indexa por `compound.key`, no por `formula` (SPEC 02 §5).
- Se registra **una sola vez**, la primera. Descripción §6.5.
- El banner "🎉 ¡Nuevo compuesto descubierto! · 8 de 30 registrados" del frame 10 aparece solo en esa primera vez.
- Reglas completas en SPEC 12.

**El motor no registra el descubrimiento.** Devuelve el resultado; `ResultView` decide qué hacer con él. `chemistry.js` no escribe estado (§2).

---

## 9. Consulta a PubChem

El motor **no** llama a PubChem. Identifica el compuesto contra el dataset local y devuelve.

`ResultView` recibe el resultado y, solo si hay compuesto identificado, pide el enriquecimiento externo a `api.js` a través de `cache.js`. Eso ocurre después del match y no puede afectarlo: si PubChem no responde, el compuesto sigue identificado y el descubrimiento igual se registra.

Es exactamente lo que promete el frame 11: *"No pudimos obtener información adicional. Los datos básicos siguen disponibles."*

Estados de carga, error, caché y offline en SPEC 09.
