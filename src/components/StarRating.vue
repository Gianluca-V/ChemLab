<script setup>
/**
 * Valoración por estrellas — SPEC 10 §4, SPEC 17 §5
 *
 * role="radiogroup" con cinco role="radio", tal como la tarjeta de
 * accesibilidad del diseño.
 *
 * Patrón de tabindex móvil: la estrella seleccionada tiene 0 y el resto -1, así
 * que el grupo es UNA sola parada de tabulación. Es el único uso de tabindex en
 * todo el proyecto; nunca se usa un tabindex positivo.
 *
 * Teclado: ← → mueven la selección, Home y End van a 1 y 5.
 *
 * El color no es el único portador: el texto `4 / 5` acompaña siempre.
 */
import { computed, ref } from 'vue';

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  labelledBy: { type: String, default: undefined },
});

const emit = defineEmits(['update:modelValue']);

const stars = [1, 2, 3, 4, 5];
const buttons = ref([]);

/** Estrella que recibe el foco al entrar al grupo: la elegida, o la primera. */
const focusTarget = computed(() => (props.modelValue >= 1 ? props.modelValue : 1));

/** @param {number} value */
function select(value) {
  emit('update:modelValue', value);
}

/**
 * @param {KeyboardEvent} event
 */
function onKeydown(event) {
  const current = props.modelValue >= 1 ? props.modelValue : 1;
  let next = null;

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(5, current + 1);
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(1, current - 1);
  if (event.key === 'Home') next = 1;
  if (event.key === 'End') next = 5;

  if (next === null) return;
  event.preventDefault();
  select(next);
  buttons.value[next - 1]?.focus();
}
</script>

<template>
  <div class="rating">
    <div
      class="rating__stars"
      role="radiogroup"
      :aria-labelledby="labelledBy"
      @keydown="onKeydown"
    >
      <button
        v-for="star in stars"
        :key="star"
        ref="buttons"
        type="button"
        role="radio"
        class="rating__star"
        :class="{ 'rating__star--on': star <= modelValue }"
        :aria-checked="star === modelValue"
        :aria-label="`${star} de 5`"
        :tabindex="star === focusTarget ? 0 : -1"
        @click="select(star)"
      >
        <span aria-hidden="true">{{ star <= modelValue ? '★' : '☆' }}</span>
      </button>
    </div>

    <p class="rating__text mono" aria-hidden="true">{{ modelValue || '—' }} / 5</p>
  </div>
</template>

<style scoped>
.rating {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.rating__stars {
  display: flex;
  gap: var(--sp-1);
}

.rating__star {
  display: grid;
  place-items: center;
  width: var(--touch);
  height: var(--touch);
  border-radius: var(--r-md);
  color: var(--mark-off);
  font-size: var(--fs-6);
  line-height: 1;
}

.rating__star--on {
  color: var(--star-on);
}

.rating__star:hover {
  background: var(--surface-3);
}

.rating__text {
  color: var(--text-3);
  font-size: var(--fs-2);
}
</style>
