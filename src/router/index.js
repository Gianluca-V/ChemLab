/**
 * Routing — SPEC 01
 *
 * Modo hash: la aplicación se publica como sitio estático, sin servidor que
 * reescriba rutas hacia index.html. El modo history exigiría configuración de
 * servidor; el modo hash no depende de nada. El frame 28 ya dibuja la barra de
 * direcciones con `chemlab.app/#/lab`.
 *
 * Toda navegación interna usa rutas con nombre, nunca strings de path armados
 * a mano.
 */

import { createRouter, createWebHashHistory } from 'vue-router';

import HomeView from '../views/HomeView.vue';
import SearchView from '../views/SearchView.vue';
import ResultsView from '../views/ResultsView.vue';
import ElementDetailView from '../views/ElementDetailView.vue';
import CompoundDetailView from '../views/CompoundDetailView.vue';
import LabView from '../views/LabView.vue';
import ResultView from '../views/ResultView.vue';
import FavoritesView from '../views/FavoritesView.vue';
import HistoryView from '../views/HistoryView.vue';
import DiscoveriesView from '../views/DiscoveriesView.vue';
import ContactView from '../views/ContactView.vue';
import NotFoundView from '../views/NotFoundView.vue';

import { useHistory } from '../composables/useHistory.js';

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: 'ChemLab' } },
  /*
    /table era "Elementos" y /lab era el panel de mezcla a pantalla completa.
    Mostraban lo mismo, así que se fusionaron en una sola sección: LabView lleva
    la búsqueda, las categorías y la tabla, y la mezcla vive en el panel que el
    shell renderiza en todas las rutas. La ruta vieja se conserva como redirect
    para que ningún enlace guardado o compartido se rompa.
  */
  { path: '/table', redirect: '/lab' },
  { path: '/search', name: 'search', component: SearchView, meta: { title: 'Búsqueda' } },
  { path: '/results', name: 'results', component: ResultsView, meta: { title: 'Resultados' } },
  {
    path: '/element/:symbol',
    name: 'element',
    component: ElementDetailView,
    meta: { title: 'Elemento' },
  },
  {
    path: '/compound/:formula',
    name: 'compound',
    component: CompoundDetailView,
    meta: { title: 'Compuesto' },
  },
  { path: '/lab', name: 'lab', component: LabView, meta: { title: 'Laboratorio' } },
  { path: '/lab/result', name: 'lab-result', component: ResultView, meta: { title: 'Resultado' } },
  {
    path: '/favorites',
    name: 'favorites',
    component: FavoritesView,
    meta: { title: 'Favoritos' },
  },
  { path: '/history', name: 'history', component: HistoryView, meta: { title: 'Historial' } },
  {
    path: '/discoveries',
    name: 'discoveries',
    component: DiscoveriesView,
    meta: { title: 'Descubrimientos' },
  },
  { path: '/contact', name: 'contact', component: ContactView, meta: { title: 'Contacto' } },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: 'Página no encontrada' },
  },
];

/**
 * Entradas de navegación, en el orden del frame 02. Se declaran una sola vez:
 * NavDrawer y NavSidebar consumen esta misma lista y los mismos badges
 * (SPEC 01 §6, SPEC 16 §5).
 *
 * `badge` nombra la fuente reactiva; el componente la resuelve.
 */
export const NAV_ITEMS = Object.freeze([
  { name: 'lab', label: 'Laboratorio' },
  { name: 'search', label: 'Búsqueda' },
  { name: 'discoveries', label: 'Descubrimientos', badge: 'discoveries' },
  { name: 'favorites', label: 'Favoritos', badge: 'favorites' },
  { name: 'history', label: 'Historial' },
  { name: 'contact', label: 'Contacto' },
]);

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,

  /**
   * Devuelve la posición guardada en back/forward y el tope en cualquier otro
   * caso. La tabla periódica es la excepción: su scroll es interno a su propio
   * contenedor y PeriodicTable conserva la posición por su cuenta (SPEC 01 §7).
   */
  scrollBehavior(to, from, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
});

/**
 * Registro automático del historial — SPEC 01 §5.
 *
 * La regla vive en UN ÚNICO PUNTO. Consecuencias buscadas:
 *   · Ninguna vista contiene lógica de historial. ElementDetailView no sabe que
 *     el historial existe.
 *   · Se registra sin importar el origen: desde resultados, desde favoritos,
 *     desde el propio historial o pegando la URL en la barra de direcciones.
 *   · Es imposible que una ruta de detalle nueva se olvide de registrar.
 *
 * Solo `element` y `compound`. Permanecer en /lab/result no genera entrada: no
 * es visitar un detalle.
 */
router.afterEach((to) => {
  if (to.name === 'element') {
    useHistory().record({ type: 'element', id: String(to.params.symbol) });
  }
  if (to.name === 'compound') {
    useHistory().record({ type: 'compound', id: String(to.params.formula) });
  }

  if (to.meta?.title) {
    document.title = to.name === 'home' ? 'ChemLab' : `${to.meta.title} · ChemLab`;
  }
});

export default router;
