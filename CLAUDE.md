# ChemLab

Laboratorio químico interactivo. Explorar los 118 elementos, combinarlos y descubrir compuestos.
Trabajo Integrador — Módulo 1, Aplicaciones Móviles.

---

## ⚠️ Orden de precedencia — leer antes de escribir código

```
1. specs/                          ← FUENTE DE VERDAD
2. design-import/CORRECCIONES.md   ← qué del diseño NO se implementa
3. design-import/*.dc.html         ← solo referencia visual
```

**El documento de diseño no fue modificado.** Conserva copy, marcado y estilos que las SPECs corrigen.
Implementar un frame al pie de la letra sin cruzar `CORRECCIONES.md` produce código que contradice lo aprobado.

Empezá por `specs/README.md`: índice, 20 decisiones tomadas, 8 contradicciones resueltas.

Las SPECs citan `descripción §N`: es la descripción funcional de origen, **que ya no se versiona**. Su contenido normativo está transcrito en SPEC 19. No la busques.

---

## Stack

Vue 3 (Composition API, `<script setup>`) · Vite · Vue Router 4 en **modo hash** · composables propios · CSS propio con custom properties.

**Dependencias de producción: `vue` y `vue-router`. Nada más.**
No agregar librerías de UI, de estilos, de estado ni de utilidades. Si hace falta una, es una decisión de arquitectura: se discute y se registra en una SPEC.

> La consigna prohíbe frameworks (SPEC 19 §1.2). El equipo decidió Vue de forma expresa y documentada. Ver SPEC 19 §1.3. **No reabrir la discusión.**

---

## Arquitectura

```
views / components  →  composables  →  services  →  (localStorage · fetch · datasets)
```

Dirección única. Reglas que no se rompen:

- **`src/services/` es JavaScript plano.** No importa `vue`, no usa `ref` ni `reactive`, no toca el DOM.
- Ningún servicio importa un composable. Ningún composable importa un componente. Ninguna vista importa otra vista.
- **`storage.js` es el único acceso a `localStorage`.** Ningún otro módulo escribe una clave literal.
- **`api.js` es el único que conoce URLs de PubChem.**

---

## Trampas conocidas

Cosas que se hacen mal por defecto. Todas tienen su motivo en la SPEC indicada.

| No hagas | Hacé | SPEC |
|---|---|---|
| Llamar `note` a la valoración por estrellas | `rating` = estrellas → UI "Valoración"<br>`note` = texto → UI "Nota" | 10 §1 |
| Indexar compuestos por `formula` | Indexar por `key` (Hill). `NaCl` tiene key `ClNa` | 02 §2.1 |
| Reducir siempre por MCD en el motor | **Exacta primero**, reducida después. Reducir siempre rompe O₂, H₂, N₂ y el peróxido | 08 §5 |
| Habilitar COMBINAR con ≥2 elementos distintos | ≥2 **átomos**. Con tipos, O₂/H₂/N₂ quedan indescubribles | 07 §4 |
| Declarar el estado del composable dentro de la función | Fuera, a nivel de módulo. Adentro rompe el singleton | 00 §4 |
| Guardar timestamp en el historial | Sin fecha ni hora. Solo el orden del array | 11 §2 |
| Deduplicar el historial globalmente | Solo **consecutivos**. `A,B,A` = 3 entradas; `A,A,A` = 1 | 11 §3 |
| `<div>` clickeable para las celdas de la tabla | `<button type="button">`. Vale para chips y desplegables | 03 §3, 17 §2 |
| Cargar fuentes desde Google Fonts | Autoalojadas en `public/fonts/`. Un `<link>` externo rompe el offline | 14 §4 |
| Escribir un color, tamaño o radio literal | Siempre `var(--token)`. Escalas cerradas | 14 |
| Texto por debajo de 11 px | 11 px es el piso absoluto | 14 §3 |
| Olvidar `response.clone()` en el Service Worker | El body es de lectura única. Sin clonar, la página queda en blanco | 18 §4 |
| Escribir datos de PubChem en `compounds.json` | El dato externo vive en `chemlab_api_cache`, se mezcla al renderizar | 02 §4 |
| Lógica de breakpoint en JavaScript | Todo responsive es CSS. Ningún listener de `resize` | 16 §2 |

---

## Persistencia

Seis claves, todas vía `storage.js`:

```
chemlab_favorites   chemlab_history   chemlab_discovered
chemlab_mixture     chemlab_theme     chemlab_api_cache
```

Guión bajo, no dos puntos. Toda mutación de un composable persiste de inmediato.

`localStorage` ≠ `Cache Storage`. El Service Worker administra el segundo y **no puede tocar el primero**: por eso actualizar la PWA no borra favoritos.

---

## Idioma

| Qué | Idioma |
|---|---|
| Copy de la interfaz | **Español rioplatense**, voseo: "Seleccioná", "Tocá", "Explorá", "Volvé a intentar" |
| Identificadores, comentarios, nombres de archivo | **Inglés** |
| SPECs y documentación | Español |
| Commits | Conventional commits, en inglés |

El voseo es una decisión de diseño presente en los 28 frames. **No neutralizar la copy.**
Los nombres de elementos y compuestos van en español; `query` de PubChem va en inglés (SPEC 09 §2).

---

## Comunicación científica

Obligatorio en toda copy. Ver SPEC 19 §6.

- El O₂ es **oxidante**, favorece la combustión. **No es combustible.**
- Nunca afirmar que una mezcla produce un compuesto. Se dice "Tu mezcla", no "Tu reacción"; "Fórmula tentativa", no "Producto".
- Sin coincidencia: *"no encontramos un compuesto compatible en la base de datos de ChemLab"*. **Nunca** "esta combinación es imposible".

---

## Accesibilidad — no negociable

- Todo lo tocable es `<button>`, `<a>`, `<input>`, `<select>` o `<textarea>`. Nunca un `<div>` con handler.
- 44 px en acciones primarias, destructivas y de ícono. 36 px con 8 px de separación en chips y acciones en línea. **Nada por debajo de 36.**
- `:focus-visible` siempre. Nunca `outline: none` sin reemplazo.
- Contraste ≥ 4.5:1 en ambos temas.
- **El color nunca es el único portador**: las estrellas llevan `4 / 5`, los errores llevan ícono, las categorías llevan leyenda.

SPEC 17 tiene la checklist de verificación por ruta.

---

## Antes de dar algo por terminado

1. ¿Contradice alguna SPEC? Si creés que la SPEC está mal, **decilo antes de desviarte**.
2. ¿Agregaste una dependencia? No.
3. ¿Escribiste en `localStorage` fuera de `storage.js`? No.
4. ¿Importaste `vue` dentro de `services/`? No.
5. ¿Hay algún literal de color, tamaño o radio? No.
6. ¿Se recorre la vista completa solo con teclado?
