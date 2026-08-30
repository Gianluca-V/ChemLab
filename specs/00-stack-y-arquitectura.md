# SPEC 00 — Stack y arquitectura

**Estado:** aprobado
**Fuentes:** descripción funcional de origen (§3, §5, §7) — ver README §Procedencia; `design-import/ChemLab Mobile First.dc.html`

---

## 1. Stack

| Capa | Decisión |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Build tool | Vite |
| Routing | Vue Router 4, modo hash |
| Estado compartido | Composables propios (sin Pinia) |
| Estilos | CSS propio con custom properties. Sin librería de UI ni de estilos |
| Datos remotos | PubChem PUG REST vía `fetch` |
| Persistencia | `localStorage`, acceso exclusivo por `services/storage.js` |
| PWA | Manifest + Service Worker (definición en SPEC 18) |

**Dependencias de producción:** `vue`, `vue-router`. No se incorporan librerías de UI, de estilos, de estado ni de utilidades sin una decisión registrada en una SPEC.

> **Desvío registrado.** La descripción funcional de origen prohibía explícitamente Vue en su §3.2, e incluía "el proyecto no utilice frameworks" como criterio de aceptación en su §41. Ambas cláusulas están transcritas en SPEC 19 §1.2 y §4 (punto 26). La decisión de usar Vue 3 + Vite fue tomada y confirmada de forma expresa por el equipo, con conocimiento de esa contradicción. Queda asentada acá para que la restricción se considere superada por esta SPEC y para que el desvío sea explicable en la defensa.

---

## 2. Principio arquitectónico

**La lógica de dominio no conoce el framework.**

Todo lo que vive en `src/services/` es JavaScript plano: no importa `vue`, no usa `ref` ni `reactive`, no toca el DOM. El motor de normalización química, el cliente de PubChem, la caché y el acceso a `localStorage` funcionan igual dentro o fuera de Vue.

La reactividad se agrega en una única capa por encima: los composables de `src/composables/`, que envuelven a los servicios y exponen estado reactivo a los componentes.

Dirección de dependencias, en un solo sentido:

```
views / components  →  composables  →  services  →  (localStorage · fetch · datasets)
```

Ningún servicio importa un composable. Ningún composable importa un componente. Ninguna vista importa otra vista.

---

## 3. Estructura de carpetas

```
/
├── index.html
├── vite.config.js
├── package.json
│
├── public/
│   ├── manifest.webmanifest
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── data/
│       ├── elements.json          118 elementos
│       └── compounds.json         dataset de compuestos de ChemLab
│
└── src/
    ├── main.js                    createApp, router, registro del Service Worker
    ├── App.vue                    shell: TopBar + NavDrawer + RouterView + ToastHost
    │
    ├── router/
    │   └── index.js               definición de rutas (SPEC 01)
    │
    ├── assets/css/
    │   ├── variables.css          tokens del diseño: dark en :root, light en [data-theme="light"]
    │   └── base.css               reset, tipografía, :focus-visible, scrollbars
    │
    ├── services/                  JavaScript plano, sin Vue
    │   ├── storage.js             único acceso a localStorage
    │   ├── cache.js               caché de respuestas de PubChem, TTL 7 días
    │   ├── api.js                 cliente PUG REST: fetch, timeout, clasificación de errores
    │   ├── elements.js            carga del dataset, búsqueda y filtrado local
    │   ├── compounds.js           carga e índice del dataset de compuestos
    │   └── chemistry.js           normalización, clave canónica, matching
    │
    ├── composables/
    │   ├── useMixture.js
    │   ├── useFavorites.js
    │   ├── useHistory.js
    │   ├── useDiscoveries.js
    │   ├── useTheme.js
    │   └── useToast.js
    │
    ├── components/
    │   ├── TopBar.vue
    │   ├── NavDrawer.vue
    │   ├── ThemeToggle.vue
    │   ├── PeriodicTable.vue
    │   ├── ElementCell.vue
    │   ├── CategoryLegend.vue
    │   ├── SearchField.vue
    │   ├── FilterChips.vue
    │   ├── ResultCard.vue
    │   ├── Pagination.vue
    │   ├── MixtureRow.vue
    │   ├── QuantityStepper.vue
    │   ├── StarRating.vue
    │   ├── NoteCounter.vue
    │   ├── FavoriteDialog.vue
    │   ├── ConfirmSheet.vue
    │   ├── ToastHost.vue
    │   ├── EmptyState.vue
    │   ├── ErrorState.vue
    │   └── SkeletonBlock.vue
    │
    └── views/
        ├── HomeView.vue
        ├── TableView.vue
        ├── SearchView.vue
        ├── ResultsView.vue
        ├── DetailView.vue
        ├── LabView.vue
        ├── ResultView.vue
        ├── FavoritesView.vue
        ├── HistoryView.vue
        ├── DiscoveriesView.vue
        └── ContactView.vue
```

---

## 4. Estado compartido: composables

No se usa una librería de gestión de estado. Cada porción de estado compartido vive en un módulo que declara su estado reactivo **a nivel de módulo**, no dentro de la función. Como los módulos ES se evalúan una sola vez, cada composable es un singleton: todos los componentes que lo importan comparten la misma instancia.

Forma canónica:

```js
// src/composables/useFavorites.js
import { reactive, computed } from 'vue';
import { read, write, KEYS } from '../services/storage.js';

const state = reactive({
  items: read(KEYS.FAVORITES, []),
});

function persist() {
  write(KEYS.FAVORITES, state.items);
}

export function useFavorites() {
  return {
    items: computed(() => state.items),
    count: computed(() => state.items.length),
    add(entry) { /* ... */ persist(); },
    update(id, patch) { /* ... */ persist(); },
    remove(id) { /* ... */ persist(); },
  };
}
```

Reglas:

1. El estado se declara fuera de la función exportada. Declararlo adentro rompe el singleton.
2. El estado se expone como `computed` de solo lectura. Toda mutación pasa por una función del composable.
3. **Toda mutación persiste inmediatamente** a `localStorage` a través de `storage.js`. No hay estado compartido que viva solo en memoria.
4. Ningún composable llama a `localStorage` directamente.

### Composables y su clave persistida

| Composable | Qué gestiona | Clave |
|---|---|---|
| `useMixture` | Elementos y cantidades seleccionados en el laboratorio | `chemlab_mixture` |
| `useFavorites` | Favoritos con valoración y mensaje | `chemlab_favorites` |
| `useHistory` | Ítems visitados | `chemlab_history` |
| `useDiscoveries` | Compuestos descubiertos | `chemlab_discovered` |
| `useTheme` | Tema claro/oscuro | `chemlab_theme` |
| `useToast` | Cola de notificaciones efímeras | no persiste |

`useToast` es la única excepción a la regla de persistencia: un toast es efímero por definición y no debe sobrevivir a una recarga.

---

## 5. Convención de claves de `localStorage`

Prefijo `chemlab_` y guión bajo:

```
chemlab_favorites
chemlab_history
chemlab_discovered
chemlab_mixture
chemlab_theme
chemlab_api_cache
```

Se adopta la convención del documento de diseño, que la declara en la tarjeta "Persistencia" y la muestra en los frames 15 y 16. Reemplaza a la convención con dos puntos (`chemlab:favorites`) propuesta en la sección 7.1 de la descripción.

Los nombres se declaran una sola vez, como constantes exportadas por `storage.js`. Ningún otro módulo escribe un literal de clave.

---

## 6. Estilos

Los tokens del documento de diseño se transcriben a `variables.css` sin reinterpretarlos: superficies, bordes, rampa de texto, acento, estados y los diez hues de categoría química.

- Tema oscuro como principal, en `:root`.
- Tema claro como alternativa, en `[data-theme="light"]`.
- Los estilos de cada componente van en su bloque `<style scoped>`.
- Lo global —reset, tipografía, `:focus-visible`, scrollbars— vive en `base.css`.
- Ningún color se escribe como literal en un componente. Siempre `var(--token)`.

---

## 7. Decisiones pendientes

Ninguna en esta SPEC. Las contradicciones detectadas entre la descripción y el diseño que siguen abiertas se resuelven en las SPECs correspondientes:

| # | Tema | Se resuelve en |
|---|---|---|
| 2 | Alcance del historial: ¿solo detalles visitados, o también experimentos? | SPEC 11 — Historial |
| 4 | Tamaño del dataset de compuestos: mínimo 20 vs. progreso "8 / 30" | SPEC 03 — Contratos de datos |

La contradicción #1 (convención de claves) queda resuelta en la sección 5 de esta SPEC.
La contradicción #3 (rutas faltantes) queda resuelta en SPEC 01 — Routing.
