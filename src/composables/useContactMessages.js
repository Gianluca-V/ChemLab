/**
 * Mensajes del formulario de contacto — almacenados en sessionStorage
 *
 * NO SE ENVÍA NINGÚN CORREO. El formulario es una demostración del uso de
 * sessionStorage: no hay servidor, no hay fetch, no hay destinatario. Cada
 * mensaje "enviado" se guarda en la sesión de la pestaña y se muestra en la
 * lista de abajo, que es todo lo que ocurre. La interfaz lo dice explícitamente
 * en vez de simular un envío que no existe.
 *
 * POR QUÉ sessionStorage Y NO localStorage:
 * el resto de la aplicación —favoritos, historial, descubrimientos, tema,
 * mezcla, caché— vive en localStorage porque su valor está en sobrevivir al
 * cierre del navegador. Un borrador de contacto no: pertenece a la visita en la
 * que se escribió. sessionStorage lo modela con exactitud, además de que es el
 * contraste que hace visible la diferencia entre los dos almacenes. Cerrar la
 * pestaña vacía esta lista y deja los favoritos intactos.
 *
 * El estado se declara a nivel de módulo, no dentro de la función: los módulos
 * ES se evalúan una sola vez, así que el composable es un singleton y todos los
 * componentes que lo importan comparten la misma instancia (SPEC 00 §4).
 */

import { computed, reactive } from 'vue';
import { SESSION_KEYS, readSession, writeSession } from '../services/storage.js';
import { useToast } from './useToast.js';

/** Tope de la escala de texto del mensaje. */
export const MAX_MESSAGE_LENGTH = 500;

/** Tope de entradas. Al superarlo se descarta la más vieja. */
export const MAX_MESSAGES = 20;

/**
 * Descarta lo que no tenga la forma esperada. El contenido de sessionStorage es
 * editable desde las herramientas de desarrollo: se valida al leer, igual que
 * el resto de los composables.
 *
 * @param {unknown} raw
 * @returns {{id: string, email: string, subject: string, message: string}[]}
 */
function sanitize(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (entry) =>
        entry &&
        typeof entry.id === 'string' &&
        typeof entry.email === 'string' &&
        typeof entry.subject === 'string' &&
        typeof entry.message === 'string'
    )
    .map((entry) => ({
      id: entry.id,
      email: entry.email,
      subject: entry.subject,
      message: entry.message,
    }))
    .slice(0, MAX_MESSAGES);
}

const state = reactive({
  items: sanitize(readSession(SESSION_KEYS.CONTACT_MESSAGES, [])),
});

const toast = useToast();

function persist() {
  if (!writeSession(SESSION_KEYS.CONTACT_MESSAGES, state.items)) toast.storageError();
}

/**
 * Identificador de la entrada. crypto.randomUUID no está en todos los
 * navegadores que la app soporta, así que hay respaldo; el id solo tiene que
 * ser único dentro del array para servir de `key` en el v-for.
 *
 * @returns {string}
 */
function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useContactMessages() {
  return {
    /** Más reciente primero. */
    items: computed(() => state.items),
    count: computed(() => state.items.length),

    /**
     * Guarda un mensaje en la sesión. No envía nada.
     *
     * @param {{email: string, subject: string, message: string}} entry
     */
    add({ email, subject, message }) {
      state.items.unshift({
        id: newId(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      if (state.items.length > MAX_MESSAGES) state.items.length = MAX_MESSAGES;
      persist();
    },

    /** @param {string} id */
    remove(id) {
      const index = state.items.findIndex((entry) => entry.id === id);
      if (index === -1) return;
      state.items.splice(index, 1);
      persist();
    },

    /** Vacía la lista de la sesión. */
    clear() {
      state.items = [];
      persist();
    },
  };
}
