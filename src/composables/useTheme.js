/**
 * Tema claro / oscuro — SPEC 14 §7
 *
 * Por defecto `system`: sin preferencia guardada se respeta la del sistema
 * operativo. El oscuro es el tema principal del diseño, pero imponérselo a
 * quien configuró claro es ignorar una preferencia ya expresada.
 *
 * El destello inicial lo evita el script en línea de index.html, que corre
 * antes de la primera hoja de estilos. Este composable toma el control cuando
 * Vue monta.
 */

import { computed, reactive } from 'vue';
import { KEYS, read, write } from '../services/storage.js';

/** @type {readonly ['system','dark','light']} */
export const THEME_VALUES = Object.freeze(['system', 'dark', 'light']);

const stored = read(KEYS.THEME, 'system');

const state = reactive({
  preference: THEME_VALUES.includes(stored) ? stored : 'system',
  systemPrefersDark: false,
});

const darkQuery =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

if (darkQuery) {
  state.systemPrefersDark = darkQuery.matches;
  // Alternar el tema del sistema con la app abierta actualiza la interfaz.
  darkQuery.addEventListener('change', (event) => {
    state.systemPrefersDark = event.matches;
    apply();
  });
}

const resolved = computed(() => {
  if (state.preference === 'system') return state.systemPrefersDark ? 'dark' : 'light';
  return state.preference;
});

/** Escribe `data-theme` en <html>. `color-scheme` viaja con el token. */
function apply() {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = resolved.value;
}

apply();

function persist() {
  return write(KEYS.THEME, state.preference);
}

export function useTheme() {
  return {
    /** 'system' | 'dark' | 'light' */
    preference: computed(() => state.preference),
    /** 'dark' | 'light' — lo que efectivamente se está mostrando */
    resolved,

    /**
     * @param {'system'|'dark'|'light'} value
     * @returns {boolean} false si no se pudo persistir
     */
    set(value) {
      if (!THEME_VALUES.includes(value)) return true;
      state.preference = value;
      apply();
      return persist();
    },

    /**
     * Alterna entre claro y oscuro partiendo de lo que se ve. Desde `system`,
     * el primer toque fija el opuesto de lo que el sistema está mostrando.
     *
     * @returns {boolean} false si no se pudo persistir
     */
    toggle() {
      state.preference = resolved.value === 'dark' ? 'light' : 'dark';
      apply();
      return persist();
    },
  };
}
