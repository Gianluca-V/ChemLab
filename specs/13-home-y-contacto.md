# SPEC 13 — Home y Contacto

**Estado:** aprobado
**Depende de:** SPEC 01, SPEC 12
**Fuentes:** descripción §15, §22, §31, §32, RF1, RF7; diseño frames 01, 02, 25, 18
**Componentes:** `HomeView.vue`, `ContactView.vue`, `MapEmbed.vue`, `ContactForm.vue`, `InstallPrompt.vue`

---

# Parte A — Home

## A.1 Composición — frames 01 y 25

```
┌────────────────────────────────┐
│  C  ChemLab                 ≡  │
│                                │
│  Explorá los 118 elementos     │
│  y combinalos                  │
│                                │
│  Datos locales de la tabla     │
│  periódica e información de    │
│  compuestos de PubChem.        │
│                                │
│  [ Ir al laboratorio ]         │
│  [ Buscar elementos ]          │
│                                │
│  ─────────────────────────     │
│  Descubrimientos     7 / 30    │
│  ███████░░░░░░░░░░░░░░░░░░     │
│                                │
│  [ Instalar ChemLab ]          │   ← condicional, §A.4
└────────────────────────────────┘
```

Cumple los seis puntos de la descripción §15: identidad, descripción breve, acceso al laboratorio, acceso a exploración, progreso resumido y navegación principal.

## A.2 Acciones

| Botón | Destino | Peso |
|---|---|---|
| `Ir al laboratorio` | `/lab` | Primaria |
| `Buscar elementos` | `/search` | Secundaria |

El laboratorio es la acción primaria porque es la funcionalidad propia de ChemLab. Buscar es el camino de exploración.

**Ambos son enlaces de router, no botones con `@click`.** Un `<RouterLink>` produce un `<a href>` real: se puede abrir en pestaña nueva, copiar la dirección y anunciar como enlace. Un `<button>` que navega pierde las tres cosas.

## A.3 Resumen de progreso

Lee `useDiscoveries()`. Muestra `count / total` y la barra, con el mismo componente `ProgressBar` de `DiscoveriesView` (SPEC 12 §4).

El bloque completo navega a `/discoveries`.

> El documento de diseño anota que el Home muestra `7` mientras el frame 17 muestra `8`, porque el frame 17 refleja el estado posterior al experimento del frame 10. Es la misma fuente reactiva en dos momentos, no una inconsistencia.

## A.4 Instalación de la PWA

`InstallPrompt` se renderiza **solo** cuando el evento `beforeinstallprompt` fue capturado y la aplicación no está instalada.

```
[ Instalar ChemLab ]
```

Descripción §32: *"El botón no debe aparecer cuando la aplicación ya esté instalada o cuando la instalación no esté disponible."*

Ningún frame lo dibuja: es un hueco de diseño. Se implementa con el estilo de acción secundaria ya definido. Mecánica completa en SPEC 18.

## A.5 Encabezado y drawer — frame 02

`TopBar` y `NavDrawer` viven en `App.vue`, fuera del `<RouterView>` (SPEC 01 §6). Se montan una vez y persisten en todas las rutas, cumpliendo RF1.

Entradas, badges y comportamiento: SPEC 01 §6.

---

# Parte B — Contacto

## B.1 Datos — frame 18, con la ubicación corregida (§B.3)

```
ChemLab · Universidad Nacional Arturo Jauretche
Aplicaciones Móviles · Florencio Varela, Buenos Aires

✉  hola@chemlab.dev
☎  +54 9 11 5555-0142
📍 Av. Calchaquí 6200, Florencio Varela

┌──────────────────────────────┐
│    mapa OpenStreetMap        │
└──────────────────────────────┘
Universidad Nacional Arturo Jauretche
−34.7750, −58.2678

[ Ver mapa ]
```

> **Contacto ficticio, ubicación real.** `hola@chemlab.dev` y `+54 9 11 5555-0142` son datos de relleno del documento de diseño y se conservan: no corresponden a una persona real.
>
> La **ubicación** sí es real y es la de la UNAJ. Ver el desvío registrado en §B.3.
>
> Se eligió no publicar datos personales de los integrantes: el trabajo puede terminar alojado en una URL pública e indexable, y uno de los integrantes no participó de esta decisión.
>
> La identificación de los autores para la cátedra se resuelve fuera de la aplicación —README del repositorio y entrega formal—, no en una pantalla pública.

## B.2 Los tres enlaces son reales

Aunque los datos sean ficticios, el **mecanismo** es genuino. Es lo que la consigna evalúa.

```html
<a href="mailto:hola@chemlab.dev">hola@chemlab.dev</a>
<a href="tel:+5491155550142">+54 9 11 5555-0142</a>
<a href="https://www.openstreetmap.org/?mlat=-34.7750&mlon=-58.2678#map=17/-34.7750/-58.2678"
   target="_blank" rel="noopener noreferrer">Ver mapa</a>
```

- `tel:` sin espacios ni guiones, en formato E.164.
- El enlace externo lleva `rel="noopener noreferrer"`. Sin `noopener`, la página destino puede manipular la nuestra vía `window.opener`.

## B.3 Ubicación

```
Universidad Nacional Arturo Jauretche
Av. Calchaquí 6200, Florencio Varela

Latitud:  −34.7750
Longitud: −58.2678
```

Las coordenadas salen de Nominatim, no de una estimación. Se muestran como texto además de aparecer en el mapa: es dato verificable sin depender de que el mapa cargue.

> **Desvío registrado respecto del documento de diseño, por decisión del equipo.** El frame 18 y la versión anterior de esta SPEC fijaban la **Catedral de La Plata** (−34.9215, −57.9536), y así lo pedía la consigna original.
>
> El equipo decidió apuntar la vista entera a la **UNAJ**, que es la institución de la materia. La tarjeta de datos, el mapa, las coordenadas, el enlace externo y el bloque offline dicen todos lo mismo.
>
> **El motivo del cambio es de coherencia, no de estética.** El código ya había movido el mapa, las coordenadas y el enlace a la UNAJ mientras la tarjeta de datos seguía diciendo "La Plata": la vista se contradecía a sí misma a diez centímetros de distancia. Había que unificar en un lado o en el otro, y se unificó en la UNAJ.
>
> **Lo que cuesta:** si la cátedra evalúa la ubicación contra la letra de la consigna, esta vista no coincide. Es una decisión consciente y queda acá para que se pueda revertir en un solo lugar.

## B.4 `MapEmbed`

`<iframe>` de OpenStreetMap. **Sin Leaflet, sin Google Maps, sin ninguna dependencia externa.** El documento de diseño lo especifica y coincide con la descripción §22: *"El mapa puede utilizar una solución web pública apropiada y debe evitar incorporar una librería de UI."*

```html
<iframe
  title="Mapa de la Universidad Nacional Arturo Jauretche"
  src="https://www.openstreetmap.org/export/embed.html?bbox=…&marker=-34.7750,-58.2678"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade">
</iframe>
```

- **`title` obligatorio.** Un `<iframe>` sin título se anuncia como "marco" y no dice qué contiene.
- `loading="lazy"`: el mapa no bloquea el renderizado de la vista.
- **Relación de aspecto fija** (`aspect-ratio: 4 / 3`), según el diseño: *"el bloque mantiene relación fija para no romper el layout mobile."* Sin eso, el iframe colapsa a 150 px de alto o desborda.

### Sin conexión

Un `<iframe>` cross-origin no se puede cachear con el Service Worker. Offline muestra la página de error del navegador dentro del marco.

Se evita: si `navigator.onLine` es `false`, **el iframe no se monta** y en su lugar se renderiza un bloque estático:

```
┌──────────────────────────────┐
│  📍                          │
│  El mapa necesita conexión.  │
│                              │
│  Universidad Nacional        │
│  Arturo Jauretche            │
│  −34.7750, −58.2678          │
└──────────────────────────────┘
```

Misma relación de aspecto, para que el layout no salte al recuperar la conexión.

Contacto **no** figura entre las funciones que la descripción §31 exige offline. Degradar el mapa es aceptable; degradar la vista entera no lo sería: los datos de contacto son locales y siempre se muestran.

## B.5 Marcado semántico

```html
<main>
  <h1>Contacto</h1>
  <address>
    <p>ChemLab · Universidad Nacional Arturo Jauretche</p>
    <p>Aplicaciones Móviles · Florencio Varela, Buenos Aires</p>
    <a href="mailto:…">…</a>
    <a href="tel:…">…</a>
  </address>
  <section aria-labelledby="ubicacion">
    <h2 id="ubicacion">Ubicación</h2>
    <MapEmbed />
  </section>
</main>
```

`<address>` es el elemento correcto para información de contacto y la descripción §25 exige elementos semánticos donde corresponda.

Los íconos ✉ ☎ 📍 son `aria-hidden="true"`: el texto del enlace ya dice qué es. Sin eso, el lector de pantalla anuncia el nombre del emoji antes de cada dato.

## B.6 Formulario de contacto — `sessionStorage`

> **Agregado por decisión del equipo.** Ningún frame lo dibuja. Existe para demostrar el uso de `sessionStorage`, que es el único almacén web que el resto del proyecto no usaba.

**No envía ningún correo.** No hay servidor, no hay `fetch`, no hay destinatario. "Guardar mensaje" escribe en `sessionStorage` y agrega la entrada a la lista de abajo. Eso es todo lo que ocurre.

El aviso va **arriba** del formulario, antes de que el usuario escriba, no al pie ni dentro del botón: quien redacta tiene que saber a qué atenerse antes de invertir el tiempo. Prometer un envío que no existe sería el mismo tipo de afirmación sin respaldo que §6 de SPEC 19 prohíbe en la copy científica.

### Por qué `sessionStorage` y no `localStorage`

Las seis claves de SPEC 00 §5 viven en `localStorage` porque su valor está en sobrevivir al cierre del navegador. Un borrador de contacto no: pertenece a la visita en la que se escribió.

El contraste es además lo que hace visible la diferencia entre los dos almacenes: cerrar la pestaña vacía esta lista y **deja los favoritos intactos**. La copy lo dice explícitamente.

```
chemlab_contact_messages   ← sessionStorage, se declara en SESSION_KEYS
```

`storage.js` sigue siendo el **único** módulo que toca almacenamiento del navegador. Se le suman `readSession` / `writeSession` / `removeSession`, con el mismo contrato de `try/catch` y valor de retorno que las tres de `localStorage`.

Las funciones NO se unifican en un `read(store, key)`: el almacén que usa cada dato es una decisión de diseño —¿esto sobrevive al cierre de la pestaña?— y tenerla en el nombre de la función la deja a la vista en el punto de llamada.

### Contrato

| Campo | Regla |
|---|---|
| `email` | Obligatorio. Validación permisiva: algo, `@`, algo, `.`, algo, sin espacios |
| `subject` | Obligatorio, hasta 80 caracteres |
| `message` | Obligatorio, hasta 500 caracteres (contados por punto de código) |

Tope de 20 entradas. Al superarlo se descarta la más vieja.

**La validación es de JavaScript, no de atributos HTML.** `required` y `type="email"` se saltean desde las herramientas de desarrollo y su mensaje nativo no se puede estilar ni traducir. Los atributos igual se declaran —dan el teclado correcto en el teléfono y la semántica al lector de pantalla— pero quien decide es `submit()`, y el `<form>` lleva `novalidate` para que el globo nativo no tape al mensaje propio.

La validación de correo es **deliberadamente permisiva**: no implementa el RFC 5322 ni decide si el buzón existe, que es algo que solo se puede saber enviando. Una expresión regular más estricta rechaza direcciones válidas, y ese error es peor.

### Accesibilidad

- Cada campo con `<label for>` real. El error lleva `role="alert"`, ícono además de color, y `aria-describedby` desde el campo que falló.
- Al fallar, el foco va al campo culpable: sin eso, un usuario de teclado lee el mensaje y tiene que volver a tabular adivinando cuál era.
- Vaciar la lista pasa por `ConfirmSheet`, como toda acción destructiva (SPEC 15 §3).
- Los borrados individuales son `<button>` de 44 px con `aria-label` que nombra el asunto.

### Layout

Una columna hasta 1023 px, dos desde ahí: datos y mapa a la izquierda, formulario al costado. El breakpoint es 1024 y no 768 porque a 768–1023 px cada mitad quedaría en unos 350 px, y ahí el mapa de 4:3 cae a 260 px de alto.
