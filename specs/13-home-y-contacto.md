# SPEC 13 — Home y Contacto

**Estado:** aprobado
**Depende de:** SPEC 01, SPEC 12
**Fuentes:** descripción §15, §22, §31, §32, RF1, RF7; diseño frames 01, 02, 25, 18
**Componentes:** `HomeView.vue`, `ContactView.vue`, `MapEmbed.vue`, `InstallPrompt.vue`

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

## B.1 Datos — frame 18, sin cambios

```
ChemLab Studio
Desarrollo frontend · La Plata, Argentina

✉  hola@chemlab.dev
☎  +54 221 555 0142
📍 Calle 14 y 51, La Plata

┌──────────────────────────────┐
│    mapa OpenStreetMap        │
└──────────────────────────────┘
Catedral de La Plata
−34.9215, −57.9536

[ Ver mapa ]
```

> **Datos ficticios, por decisión del equipo.** "ChemLab Studio", `hola@chemlab.dev`, `+54 221 555 0142` y "Calle 14 y 51" son datos de relleno del documento de diseño y se conservan tal cual. No corresponden a una organización ni a una persona real.
>
> Se eligió no publicar datos personales de los integrantes: el trabajo puede terminar alojado en una URL pública e indexable, y uno de los integrantes no participó de esta decisión.
>
> La identificación de los autores para la cátedra se resuelve fuera de la aplicación —README del repositorio y entrega formal—, no en una pantalla pública.

## B.2 Los tres enlaces son reales

Aunque los datos sean ficticios, el **mecanismo** es genuino. Es lo que la consigna evalúa.

```html
<a href="mailto:hola@chemlab.dev">hola@chemlab.dev</a>
<a href="tel:+542215550142">+54 221 555 0142</a>
<a href="https://www.openstreetmap.org/?mlat=-34.9215&mlon=-57.9536#map=17/-34.9215/-57.9536"
   target="_blank" rel="noopener noreferrer">Ver mapa</a>
```

- `tel:` sin espacios ni guiones, en formato E.164.
- El enlace externo lleva `rel="noopener noreferrer"`. Sin `noopener`, la página destino puede manipular la nuestra vía `window.opener`.

## B.3 Ubicación exigida

La consigna fija la **Catedral de La Plata**:

```
Latitud:  −34.9215
Longitud: −57.9536
```

Las coordenadas se muestran como texto además de aparecer en el mapa. Es dato verificable sin depender de que el mapa cargue.

## B.4 `MapEmbed`

`<iframe>` de OpenStreetMap. **Sin Leaflet, sin Google Maps, sin ninguna dependencia externa.** El documento de diseño lo especifica y coincide con la descripción §22: *"El mapa puede utilizar una solución web pública apropiada y debe evitar incorporar una librería de UI."*

```html
<iframe
  title="Mapa de la Catedral de La Plata"
  src="https://www.openstreetmap.org/export/embed.html?bbox=…&marker=-34.9215,-57.9536"
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
│  Catedral de La Plata        │
│  −34.9215, −57.9536          │
└──────────────────────────────┘
```

Misma relación de aspecto, para que el layout no salte al recuperar la conexión.

Contacto **no** figura entre las funciones que la descripción §31 exige offline. Degradar el mapa es aceptable; degradar la vista entera no lo sería: los datos de contacto son locales y siempre se muestran.

## B.5 Marcado semántico

```html
<main>
  <h1>Contacto</h1>
  <address>
    <p>ChemLab Studio</p>
    <p>Desarrollo frontend · La Plata, Argentina</p>
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
