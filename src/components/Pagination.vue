<script setup>
/**
 * Paginación — SPEC 05 §5
 *
 * Ventana deslizante: siempre la primera página, la última, la actual y sus dos
 * vecinas. Los tramos omitidos se colapsan en una elipsis.
 *
 * El ancho es constante a partir de la página 3: la barra no salta de tamaño al
 * navegar. Peor caso: 7 controles de 44 px + 2 elipsis + 8 gaps = 380 px, que
 * entra en el ancho de contenido de una pantalla de 390 px.
 *
 * La elipsis es un <span aria-hidden>, no un botón: no es un control y no debe
 * recibir foco.
 *
 * Las flechas se deshabilitan en los extremos, no se ocultan: un control que
 * desaparece desplaza el resto de la barra.
 */
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
});

defineEmits(['go']);

/** @returns {(number|'gap')[]} */
const items = computed(() => {
  const { page, totalPages } = props;
  const pages = new Set([1, totalPages, page, page - 1, page + 1]);

  const visible = [...pages]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  const withGaps = [];
  visible.forEach((n, index) => {
    if (index > 0 && n - visible[index - 1] > 1) withGaps.push('gap');
    withGaps.push(n);
  });

  return withGaps;
});
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="Paginación de resultados">
    <button
      type="button"
      class="pagination__step"
      aria-label="Página anterior"
      :disabled="page === 1"
      @click="$emit('go', page - 1)"
    >
      <span aria-hidden="true">‹</span>
    </button>

    <template v-for="(item, index) in items" :key="`${item}-${index}`">
      <span v-if="item === 'gap'" class="pagination__gap" aria-hidden="true">…</span>

      <button
        v-else-if="item === page"
        type="button"
        class="pagination__page pagination__page--current"
        aria-current="page"
        :aria-label="`Página ${item}, actual`"
      >
        {{ item }}
      </button>

      <button
        v-else
        type="button"
        class="pagination__page"
        :aria-label="`Ir a la página ${item}`"
        @click="$emit('go', item)"
      >
        {{ item }}
      </button>
    </template>

    <button
      type="button"
      class="pagination__step"
      aria-label="Página siguiente"
      :disabled="page === totalPages"
      @click="$emit('go', page + 1)"
    >
      <span aria-hidden="true">›</span>
    </button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  max-width: 100%;
  overflow-x: auto;
}

.pagination__step,
.pagination__page {
  display: grid;
  place-items: center;
  min-width: var(--touch);
  height: var(--touch);
  padding: 0 var(--sp-1);
  border: 1px solid transparent;
  border-radius: var(--r-md);
  color: var(--text-2);
  font-size: var(--fs-3);
}

.pagination__step:hover:not(:disabled),
.pagination__page:hover {
  background: var(--surface-3);
  color: var(--text-1);
}

.pagination__step:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination__page--current {
  border-color: var(--accent);
  background: var(--surface-4);
  color: var(--text-1);
  font-weight: 600;
  cursor: default;
}

.pagination__gap {
  width: var(--sp-5);
  color: var(--text-muted);
  text-align: center;
}
</style>
