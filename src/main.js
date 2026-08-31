/**
 * Punto de entrada — SPEC 00 §3
 *
 * Los dos datasets se cargan ANTES de montar. Es lo que permite que el detalle
 * de elemento no tenga estado de carga (SPEC 06 §1): cuando la vista se monta,
 * el dataset ya está en memoria y resolver /element/:symbol es un lookup en un
 * Map. Pintar un skeleton para eso sería simular una latencia que no existe.
 *
 * El registro del Service Worker se agrega acá cuando se implemente SPEC 18.
 */

import { createApp } from 'vue';

import './assets/css/variables.css';
import './assets/css/base.css';

import App from './App.vue';
import router from './router/index.js';
import { loadElements } from './services/elements.js';
import { loadCompounds } from './services/compounds.js';

/**
 * Si los datasets no cargan no hay aplicación posible: sin los 118 elementos no
 * hay tabla, ni búsqueda, ni detalle. Se informa en el idioma de la interfaz en
 * lugar de dejar una pantalla en blanco.
 *
 * @param {Error} error
 */
function renderFatalError(error) {
  const root = document.getElementById('app');
  if (!root) return;

  const wrapper = document.createElement('div');
  wrapper.setAttribute('role', 'alert');
  wrapper.style.cssText =
    'max-width:34rem;margin:0 auto;padding:var(--sp-6) var(--sp-4);text-align:center';

  const title = document.createElement('h1');
  title.textContent = 'No pudimos cargar los datos de ChemLab';

  const body = document.createElement('p');
  body.style.marginTop = 'var(--sp-3)';
  body.textContent =
    'Revisá tu conexión y volvé a cargar la página. Si el problema sigue, los archivos de datos pueden no estar publicados.';

  const detail = document.createElement('p');
  detail.style.cssText = 'margin-top:var(--sp-3);font-size:var(--fs-2);color:var(--text-muted)';
  detail.textContent = error.message;

  wrapper.append(title, body, detail);
  root.replaceChildren(wrapper);
}

Promise.all([loadElements(), loadCompounds()])
  .then(() => {
    createApp(App).use(router).mount('#app');
  })
  .catch(renderFatalError);
