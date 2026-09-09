<script setup>
/**
 * Diálogo de favorito — frames 12, 13, 14
 *
 * Copy corregida respecto del diseño (CORRECCIONES §1, SPEC 10 §1):
 *   `Tu nota *`      → `Valoración *`   (son estrellas)
 *   `Mensaje corto`  → `Nota`           (es texto)
 *   `Sin nota`       → `Sin valoración`
 *
 * <dialog> nativo con showModal(): backdrop, atrapado de foco, Escape e
 * inertización del fondo sin JavaScript propio. Al cerrarse, el foco vuelve al
 * control que lo abrió, que es comportamiento nativo del elemento.
 *
 * Las reglas completas de favoritos se especifican en SPEC 10; acá se implementa
 * el contrato de SPEC 02 §5: rating entero 1–5 obligatorio, note de 0 a 200
 * caracteres opcional.
 */
import { computed, nextTick, ref, watch } from 'vue';
import { MAX_NOTE_LENGTH } from '../composables/useFavorites.js';
import NoteCounter from './NoteCounter.vue';
import StarRating from './StarRating.vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  /** Nombre del ítem, para el título del diálogo. */
  itemName: { type: String, required: true },
  /** Favorito existente en modo edición, o null en modo alta. */
  existing: { type: Object, default: null },
});

const emit = defineEmits(['save', 'delete', 'close']);

const dialog = ref(null);
const rating = ref(0);
const note = ref('');
const error = ref('');
const ratingGroup = ref(null);

const isEditing = computed(() => props.existing !== null);

/*
  Puntos de código, no unidades UTF-16: "🎉".length es 2 en JavaScript y 1 para
  quien escribe. Sin esto, dos emoji consumirían cuatro de los 200 y el contador
  mentiría (SPEC 10 §5).
*/
const noteLength = computed(() => [...note.value].length);

watch(
  () => props.open,
  async (isOpen) => {
    const element = dialog.value;
    if (!element) return;

    if (isOpen) {
      rating.value = props.existing?.rating ?? 0;
      note.value = props.existing?.note ?? '';
      error.value = '';
      if (!element.open) element.showModal();
      // El foco inicial va al primer campo, no a una acción destructiva.
      await nextTick();
      ratingGroup.value?.querySelector('[tabindex="0"]')?.focus();
    } else if (element.open) {
      element.close();
    }
  }
);

const noteField = ref(null);

function submit() {
  if (rating.value < 1) {
    error.value = 'Tenés que elegir una valoración de 1 a 5 estrellas.';
    ratingGroup.value?.querySelector('[tabindex="0"]')?.focus();
    return;
  }
  /*
    El maxlength del textarea ya frena la escritura, pero se valida igual en
    JavaScript: un atributo HTML se saltea desde las herramientas de desarrollo
    y la descripción §18 pide que la validación sea de JS (SPEC 10 §5).
  */
  if (noteLength.value > MAX_NOTE_LENGTH) {
    error.value = 'La nota no puede superar los 200 caracteres.';
    noteField.value?.focus();
    return;
  }
  error.value = '';
  emit('save', { rating: rating.value, note: note.value.trim() });
}
</script>

<template>
  <dialog ref="dialog" class="fav" aria-labelledby="fav-title" @close="emit('close')">
    <form class="fav__form" method="dialog" @submit.prevent="submit">
      <h2 id="fav-title" class="fav__title">
        {{ isEditing ? 'Editar tu favorito' : 'Guardar en favoritos' }} · {{ itemName }}
      </h2>

      <div class="fav__field">
        <p id="fav-rating-label" class="fav__label">Valoración *</p>
        <div ref="ratingGroup">
          <StarRating v-model="rating" labelled-by="fav-rating-label" />
        </div>
        <button type="button" class="btn btn--inline btn--ghost" @click="rating = 0">
          Sin valoración
        </button>
      </div>

      <div class="fav__field">
        <label for="fav-note" class="fav__label">Nota</label>
        <textarea
          id="fav-note"
          ref="noteField"
          v-model="note"
          class="fav__note"
          rows="3"
          :maxlength="MAX_NOTE_LENGTH"
        />
        <NoteCounter :value="noteLength" :max="MAX_NOTE_LENGTH" />
      </div>

      <p v-if="error" class="fav__error" role="alert">{{ error }}</p>

      <div class="fav__actions">
        <button type="button" class="btn btn--ghost" @click="emit('close')">Cancelar</button>
        <button
          v-if="isEditing"
          type="button"
          class="btn btn--danger"
          @click="emit('delete')"
        >
          Eliminar
        </button>
        <button type="submit" class="btn btn--primary">Guardar</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.fav {
  width: min(28rem, 92vw);
  /*
    En 390 px de alto, un diálogo de 500 px no entra (SPEC 16 §7). dvh y no vh:
    `vh` mide el viewport con la barra de direcciones retraída, así que con la
    barra visible el diálogo sobra la pantalla y "Guardar" queda abajo del
    borde.
  */
  max-height: 90dvh;
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-lg);
  background: var(--surface-2);
  color: var(--text-2);
}

/*
  El scroll se declara UNA sola vez, en el formulario, y el alto lo pone el
  diálogo. Antes los dos llevaban `max-height: 90vh`: el formulario no
  descontaba el borde del diálogo, así que en un alto justo aparecían dos
  barras de scroll anidadas por 2 px.

  El selector es `[open]` a propósito: `display: flex` sobre el `dialog` pelado
  pisa el `display: none` con el que el elemento se oculta mientras está
  cerrado, y el diálogo quedaría pintado siempre.
*/
.fav[open] {
  display: flex;
  flex-direction: column;
}

.fav::backdrop {
  background: rgba(0, 0, 0, 0.56);
}

.fav__form {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: var(--sp-4);
  padding: var(--sp-4);
  overflow-y: auto;
}

.fav__title {
  font-size: var(--fs-5);
}

.fav__field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--sp-2);
}

.fav__label {
  color: var(--text-hi);
  font-size: var(--fs-2);
  font-weight: 500;
}

.fav__note {
  width: 100%;
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--border-input);
  border-radius: var(--r-md);
  background: var(--surface-3);
  color: var(--text-1);
  font-size: var(--fs-3);
  resize: vertical;
  transition: border-color var(--dur) var(--ease);
}

/* El campo también acusa el puntero: sin eso, el único control del diálogo que
   no responde al hover es justo donde el usuario va a escribir. */
.fav__note:hover {
  border-color: var(--border-strong);
}

.fav__error {
  color: var(--hazard-text);
  font-size: var(--fs-2);
}

.fav__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--sp-2);
}
</style>
