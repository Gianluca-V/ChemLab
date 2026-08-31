/**
 * Cola de notificaciones efímeras — SPEC 15 §2
 *
 * Única excepción a la regla de persistencia de SPEC 00 §4: un toast es
 * efímero por definición y no debe sobrevivir a una recarga.
 *
 * El estado se declara a nivel de módulo, no dentro de la función: como los
 * módulos ES se evalúan una sola vez, el composable es un singleton y todos los
 * componentes que lo importan comparten la misma instancia.
 */

import { computed, reactive } from 'vue';

const DURATION_MS = 4000;

const state = reactive({
  /** @type {null | {type: string, title: string, detail: string, undo: null|Function, count: number}} */
  current: null,
});

let timer = null;
let deadline = 0;
let remaining = DURATION_MS;
/** @type {null | ((count: number) => {title: string, detail: string})} */
let formatter = null;

function stopTimer() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

function startTimer(ms) {
  stopTimer();
  remaining = ms;
  deadline = Date.now() + ms;
  timer = setTimeout(() => {
    state.current = null;
    formatter = null;
    timer = null;
  }, ms);
}

function reset() {
  stopTimer();
  state.current = null;
  formatter = null;
}

/**
 * Muestra un toast. NUNCA hay más de uno visible.
 *
 * Un toast nuevo del MISMO tipo dentro de la ventana de 4 s reemplaza al
 * anterior, reinicia el temporizador y acumula el conteo. Uno de otro tipo
 * reemplaza sin acumular y arranca su propio conteo.
 *
 * No es una cola: tres toques en dos segundos producirían doce segundos de
 * toasts contando una historia vieja, con el "Deshacer" del primero apareciendo
 * cuando el usuario ya hizo dos cosas más.
 *
 * `undo` se conserva el del PRIMER toast de la ráfaga: deshacer revierte la
 * ráfaga entera, no el último elemento. El usuario percibió una acción continua
 * y deshacerla en partes no coincide con lo que hizo.
 *
 * @param {object} options
 * @param {string} options.type
 * @param {string} [options.title]
 * @param {string} [options.detail]
 * @param {Function|null} [options.undo]
 * @param {boolean} [options.accumulate]  Suma al conteo si el tipo se repite
 * @param {(count: number) => {title: string, detail: string}} [options.format]
 */
function show({ type, title = '', detail = '', undo = null, accumulate = false, format = null }) {
  const isBurst = accumulate && state.current?.type === type;

  if (isBurst) {
    state.current.count += 1;
  } else {
    state.current = { type, title, detail, undo, count: 1 };
    formatter = format;
  }

  if (formatter) {
    const rendered = formatter(state.current.count);
    state.current.title = rendered.title;
    state.current.detail = rendered.detail;
  }

  startTimer(DURATION_MS);
}

/** Cierra el toast antes de tiempo. */
function dismiss() {
  reset();
}

/** Ejecuta la acción de deshacer y cierra. */
function undo() {
  const action = state.current?.undo;
  reset();
  if (action) action();
}

/**
 * Pausa el temporizador. Un toast que desaparece mientras el usuario va a tocar
 * "Deshacer" es una trampa.
 */
function pause() {
  if (timer === null) return;
  remaining = Math.max(0, deadline - Date.now());
  stopTimer();
}

/** Reanuda el temporizador con el tiempo que quedaba. */
function resume() {
  if (state.current === null || timer !== null) return;
  startTimer(remaining);
}

/** Aviso de fallo de almacenamiento — SPEC 15 §7. */
function storageError() {
  show({
    type: 'storage-error',
    title: 'No pudimos guardar tus datos en este navegador.',
    detail: 'Los cambios valen solo para esta sesión.',
  });
}

const toast = computed(() => state.current);

export function useToast() {
  return { toast, show, dismiss, undo, pause, resume, storageError };
}
