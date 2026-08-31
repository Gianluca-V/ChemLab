<script setup>
/**
 * Error de red — SPEC 15 §6, mensajes en SPEC 09 §3
 *
 * Dos formas según cuánto se pudo mostrar:
 *   `inline` (frame 11) — el compuesto está identificado, falló solo el
 *     enriquecimiento. Reemplaza el bloque de PubChem; el resto queda intacto.
 *   `view` (frame 22) — no hay nada que mostrar en el bloque externo.
 *
 * "Reintentar" es SIEMPRE la acción primaria: en los 20 frames originales no
 * existía ningún reintento, y el frame 22 lo corrigió.
 *
 * Ícono SVG además del color: el color no es el único portador del estado.
 */
import { computed } from 'vue';
import { errorMessage, MAX_ATTEMPTS } from '../services/api.js';

const props = defineProps({
  variant: {
    type: String,
    default: 'inline',
    validator: (value) => ['inline', 'view'].includes(value),
  },
  /** ApiError, o cualquier objeto con `type` y `status`. */
  error: { type: Object, default: null },
  /** Contexto que se conserva pese al fallo, p. ej. la fórmula de la mezcla. */
  context: { type: String, default: '' },
  attemptsUsed: { type: Number, default: 0 },
});

const emit = defineEmits(['retry']);

const message = computed(() => errorMessage(props.error));

const exhausted = computed(() => props.attemptsUsed >= MAX_ATTEMPTS);

/** `timeout tras 8 s · intento 2 de 3` — la línea técnica del frame 22. */
const attemptLine = computed(() => {
  if (props.attemptsUsed === 0) return '';
  const cause = props.error?.type === 'timeout' ? 'timeout tras 8 s' : props.error?.type;
  return `${cause} · intento ${Math.min(props.attemptsUsed, MAX_ATTEMPTS)} de ${MAX_ATTEMPTS}`;
});
</script>

<template>
  <div class="error" :class="`error--${variant}`" role="alert">
    <svg class="error__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 3.2 1.8 20.8h20.4L12 3.2Zm0 5.6v5.4m0 3.2v.1"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <div class="error__body">
      <h2 v-if="variant === 'view'" class="error__title">No pudimos consultar PubChem</h2>

      <p class="error__message">
        <template v-if="variant === 'inline'">
          No pudimos obtener información adicional. Los datos básicos siguen disponibles.
        </template>
        <template v-else>
          {{ message }}
          <template v-if="context">
            Tu mezcla {{ context }} sigue guardada; volvé a intentar cuando tengas señal.
          </template>
        </template>
      </p>

      <p v-if="attemptLine" class="error__attempts mono">{{ attemptLine }}</p>

      <div class="error__actions">
        <button
          type="button"
          class="btn btn--primary"
          :class="{ 'btn--inline': variant === 'inline' }"
          :aria-disabled="exhausted"
          @click="exhausted || emit('retry')"
        >
          Reintentar
        </button>
        <slot name="secondary" />
      </div>

      <p v-if="exhausted" class="error__attempts">
        Agotaste los {{ MAX_ATTEMPTS }} intentos. Salí de la pantalla y volvé a entrar para
        intentarlo de nuevo.
      </p>
    </div>
  </div>
</template>

<style scoped>
.error {
  display: flex;
  gap: var(--sp-3);
  border: 1px solid var(--accent-border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
  color: var(--text-2);
}

.error--inline {
  padding: var(--sp-3);
}

.error--view {
  flex-direction: column;
  align-items: center;
  padding: var(--sp-5) var(--sp-4);
  text-align: center;
}

.error__icon {
  flex: none;
  width: var(--sp-5);
  height: var(--sp-5);
  color: var(--hazard-text);
}

.error--view .error__icon {
  width: var(--sp-6);
  height: var(--sp-6);
}

.error__body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  min-width: 0;
}

.error--view .error__body {
  align-items: center;
}

.error__title {
  color: var(--text-1);
  font-size: var(--fs-5);
}

.error__message {
  max-width: 42ch;
  font-size: var(--fs-3);
}

.error__attempts {
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.error__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin-top: var(--sp-1);
}
</style>
