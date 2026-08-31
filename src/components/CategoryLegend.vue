<script setup>
/**
 * Leyenda de categorías químicas — SPEC 03 §5, enmendado por SPEC 04 §6
 *
 * Presente en TODOS los breakpoints. La leyenda aparecía en los frames de
 * tablet y desktop y en ningún frame de 390 px: en mobile las celdas quedaban
 * codificadas por color sin ninguna clave que lo descifrara, y diez hues sin
 * leyenda no comunican nada.
 *
 * Leyenda Y filtro a la vez. Con las diez categorías finas, una leyenda de solo
 * lectura y una fila de chips mostrarían la misma lista de diez etiquetas
 * coloreadas en la misma pantalla. Se fusionan: el chip coloreado ES la
 * leyenda.
 *
 * Mobile y tablet: <details> colapsable, cerrado por defecto. <summary> es
 * focusable y operable por teclado sin una línea de JavaScript, y cerrado ocupa
 * 44 px sin afectar al contenedor de 408 px de la tabla.
 *
 * Desktop: expandida de forma permanente, como en el frame 28.
 *
 * Son dos bloques y no un `open` calculado porque el estado abierto de un
 * <details> no se puede forzar desde CSS, y calcularlo en JavaScript metería
 * lógica de breakpoint donde SPEC 16 §2 no la admite. El bloque que no
 * corresponde va con `display: none`, así que tampoco está en el árbol
 * accesible: nunca hay dos juegos de chips anunciados a la vez.
 *
 * Las diez etiquetas salen del mapa único de services/elements.js. No se
 * escriben a mano acá.
 */
import { computed } from 'vue';
import { CATEGORY_KEYS, CATEGORY_LABELS_SHORT } from '../services/elements.js';
import FilterChips from './FilterChips.vue';

const props = defineProps({
  modelValue: { type: String, required: true },
});

defineEmits(['update:modelValue']);

const options = computed(() => [
  { value: 'all', label: 'Todas' },
  ...CATEGORY_KEYS.map((key) => ({
    value: key,
    label: CATEGORY_LABELS_SHORT[key],
    hue: key,
  })),
]);

/** Cerrado, el summary muestra el filtro activo: `Categorías · Halógenos`. */
const summary = computed(() =>
  props.modelValue === 'all'
    ? 'Categorías químicas'
    : `Categorías · ${CATEGORY_LABELS_SHORT[props.modelValue]}`
);
</script>

<template>
  <div class="legend">
    <details class="legend__collapsible">
      <summary class="legend__summary">{{ summary }}</summary>
      <div class="legend__body">
        <FilterChips
          :options="options"
          :model-value="modelValue"
          legend="Filtrar por categoría química"
          hide-legend
          @update:model-value="$emit('update:modelValue', $event)"
        />
      </div>
    </details>

    <div class="legend__static">
      <FilterChips
        :options="options"
        :model-value="modelValue"
        legend="Categorías químicas"
        @update:model-value="$emit('update:modelValue', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.legend {
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
}

.legend__summary {
  display: flex;
  align-items: center;
  min-height: var(--touch);
  padding: 0 var(--sp-3);
  color: var(--text-hi);
  font-size: var(--fs-3);
  font-weight: 500;
  cursor: pointer;
  list-style-position: inside;
}

.legend__body {
  padding: 0 var(--sp-3) var(--sp-3);
}

.legend__static {
  display: none;
  padding: var(--sp-3);
}

@media (min-width: 1024px) {
  .legend__collapsible {
    display: none;
  }

  .legend__static {
    display: block;
  }
}
</style>
