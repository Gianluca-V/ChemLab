<script setup>
/**
 * Hoja de confirmación destructiva — frame 23, SPEC 15 §3
 *
 * <dialog> nativo con showModal(): backdrop, atrapado de foco, Escape e
 * inertización del fondo salen gratis. Cubre la lista sobre la que actúa; las
 * filas siguen visibles debajo del scrim, para que el usuario vea el contexto
 * de lo que va a destruir.
 *
 * Escape y tocar el scrim cancelan (SPEC 10 §8, SPEC 11 §5).
 *
 * El foco inicial va a "Cancelar", no a la acción destructiva (SPEC 15 §3,
 * SPEC 17 §5). El texto lo arma quien invoca el componente: dice qué se
 * pierde, cuánto y por qué es irreversible — nunca un "¿Estás seguro?" genérico
 * (SPEC 15 §3).
 */
import { nextTick, ref, watch } from 'vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  body: { type: String, required: true },
  confirmLabel: { type: String, default: 'Eliminar' },
  cancelLabel: { type: String, default: 'Cancelar' },
});

const emit = defineEmits(['confirm', 'close']);

const dialog = ref(null);
const cancelButton = ref(null);

watch(
  () => props.open,
  async (isOpen) => {
    const element = dialog.value;
    if (!element) return;

    if (isOpen) {
      if (!element.open) element.showModal();
      await nextTick();
      cancelButton.value?.focus();
    } else if (element.open) {
      element.close();
    }
  }
);

/**
 * Cancela al tocar el scrim.
 *
 * Un click sobre el backdrop tiene como target al propio <dialog>, así que no
 * alcanza con comparar el target: el padding de la hoja también lo tiene. Se
 * cruza además contra el rectángulo del diálogo, y solo se cierra si el punto
 * cayó afuera.
 *
 * @param {MouseEvent} event
 */
function onScrimClick(event) {
  const element = dialog.value;
  if (!element || event.target !== element) return;

  const box = element.getBoundingClientRect();
  const inside =
    event.clientX >= box.left &&
    event.clientX <= box.right &&
    event.clientY >= box.top &&
    event.clientY <= box.bottom;

  if (!inside) emit('close');
}
</script>

<template>
  <dialog
    ref="dialog"
    class="confirm"
    aria-labelledby="confirm-title"
    @click="onScrimClick"
    @close="emit('close')"
  >
    <div class="confirm__handle" aria-hidden="true" />

    <h2 id="confirm-title" class="confirm__title">{{ title }}</h2>
    <p class="confirm__body">{{ body }}</p>

    <div class="confirm__actions">
      <button ref="cancelButton" type="button" class="btn btn--ghost" @click="emit('close')">
        {{ cancelLabel }}
      </button>
      <button type="button" class="btn btn--danger" @click="emit('confirm')">
        {{ confirmLabel }}
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.confirm {
  width: min(28rem, 92vw);
  /*
    dvh y no vh: en un navegador móvil `vh` mide el viewport GRANDE, el que
    existe con la barra de direcciones retraída. Con la barra visible, una hoja
    de 90vh sobra la pantalla y "Eliminar" queda fuera de alcance justo cuando
    el usuario tiene que decidir. dvh mide lo que se ve ahora.
  */
  max-height: 90dvh;
  margin: auto auto 0;
  padding: var(--sp-4);
  /*
    La hoja se ancla al borde inferior, que en un teléfono con indicador de
    inicio no es zona tocable. El inset lo separa de ahí; en un equipo sin
    recorte, env() vale 0 y el padding queda como estaba.
  */
  padding-bottom: calc(var(--sp-4) + env(safe-area-inset-bottom));
  overflow-y: auto;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-lg) var(--r-lg) 0 0;
  background: var(--surface-2);
  color: var(--text-2);
}

.confirm::backdrop {
  background: rgba(0, 0, 0, 0.56);
}

.confirm__handle {
  width: var(--sp-6);
  height: var(--sp-1);
  margin: 0 auto var(--sp-4);
  border-radius: var(--r-full);
  background: var(--border-strong);
}

.confirm__title {
  font-size: var(--fs-5);
}

.confirm__body {
  margin-top: var(--sp-2);
  color: var(--text-3);
  font-size: var(--fs-3);
}

.confirm__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--sp-2);
  margin-top: var(--sp-4);
}

@media (min-width: 768px) {
  .confirm {
    margin: auto;
    padding-bottom: var(--sp-4);
    border-radius: var(--r-lg);
  }

  .confirm__handle {
    display: none;
  }
}
</style>
