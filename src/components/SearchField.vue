<script setup>
/**
 * Campo de búsqueda — SPEC 04 §2, SPEC 17 §2
 *
 * <input type="search"> con <label> asociado. NO placeholder como única
 * etiqueta: un placeholder desaparece al escribir y un lector de pantalla no lo
 * lee como nombre del control.
 *
 * Debounce de 250 ms sobre el TÉRMINO solamente. Los filtros de chip y select
 * aplican de inmediato: son un clic deliberado, no una secuencia de tecleo.
 */
import { onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Nombre, símbolo o número atómico' },
  id: { type: String, default: 'q' },
  debounce: { type: Number, default: 250 },
});

const emit = defineEmits(['update:modelValue']);

const draft = ref(props.modelValue);
let timer = null;

// El valor puede cambiar desde afuera: "Limpiar" resetea el término.
watch(
  () => props.modelValue,
  (value) => {
    if (value !== draft.value) draft.value = value;
  }
);

function onInput() {
  clearTimeout(timer);
  timer = setTimeout(() => emit('update:modelValue', draft.value), props.debounce);
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <input :id="id" v-model="draft" type="search" autocomplete="off" @input="onInput" />
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

label {
  color: var(--text-hi);
  font-size: var(--fs-2);
  font-weight: 500;
}

input {
  min-height: var(--touch);
  padding: 0 var(--sp-3);
  border: 1px solid var(--border-input);
  border-radius: var(--r-md);
  background: var(--surface-2);
  color: var(--text-1);
  font-size: var(--fs-3);
}

input::placeholder {
  color: var(--text-muted);
}
</style>
