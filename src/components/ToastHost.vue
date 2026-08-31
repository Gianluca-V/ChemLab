<script setup>
/**
 * Notificaciones efímeras — SPEC 15 §2, frame 24
 *
 * Un solo ToastHost, en App.vue, al pie. useToast() es su única entrada y ya
 * resuelve el reemplazo con acumulación: nunca hay más de un toast visible.
 *
 * role="status" y aria-live="polite": informa, no interrumpe, y no roba el foco.
 *
 * El temporizador se pausa al pasar el mouse por encima o al recibir foco. Un
 * toast que desaparece mientras el usuario va a tocar "Deshacer" es una trampa.
 */
import { useToast } from '../composables/useToast.js';

const { toast, dismiss, undo, pause, resume } = useToast();
</script>

<template>
  <div class="toast-host" role="status" aria-live="polite">
    <div
      v-if="toast"
      class="toast"
      @mouseenter="pause"
      @mouseleave="resume"
      @focusin="pause"
      @focusout="resume"
    >
      <svg class="toast__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="m4.5 12.5 5 5 10-11"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <div class="toast__body">
        <p class="toast__title">{{ toast.title }}</p>
        <p v-if="toast.detail" class="toast__detail">{{ toast.detail }}</p>
      </div>

      <button v-if="toast.undo" type="button" class="btn btn--inline toast__undo" @click="undo">
        Deshacer
      </button>

      <button type="button" class="toast__close" aria-label="Cerrar el aviso" @click="dismiss">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="m6 6 12 12M18 6 6 18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 60;
  display: flex;
  justify-content: center;
  padding: var(--sp-3);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  max-width: 32rem;
  padding: var(--sp-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-lg);
  background: var(--surface-3);
  box-shadow: var(--shadow-2);
  pointer-events: auto;
}

.toast__icon {
  flex: none;
  width: var(--sp-5);
  height: var(--sp-5);
  color: var(--accent-soft);
}

.toast__body {
  flex: 1;
  min-width: 0;
}

.toast__title {
  color: var(--text-1);
  font-size: var(--fs-3);
  font-weight: 600;
}

.toast__detail {
  color: var(--text-3);
  font-size: var(--fs-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toast__undo {
  flex: none;
}

.toast__close {
  flex: none;
  display: grid;
  place-items: center;
  width: var(--touch);
  height: var(--touch);
  border-radius: var(--r-md);
  color: var(--text-3);
}

.toast__close svg {
  width: var(--sp-4);
  height: var(--sp-4);
}

.toast__close:hover {
  color: var(--text-1);
}
</style>
