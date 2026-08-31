<script setup>
/**
 * Tarjeta de resultado — SPEC 05 §4
 *
 * El cuerpo y el "+" son dos <button> HERMANOS, no anidados. Un botón dentro de
 * otro botón es HTML inválido y produce comportamiento indefinido.
 *
 * La masa atómica SÍ se muestra en todos los breakpoints: la tarjeta tiene
 * ancho completo y no sufre la restricción de la celda de 56×64 px que motivó
 * el desvío de SPEC 03 §3.
 *
 * El "+" no navega. El usuario sigue en la lista y puede agregar varios
 * elementos seguidos: ésta es la vía de alto volumen para armar una mezcla,
 * frente al recorrido por el detalle.
 */
import { computed } from 'vue';
import { CATEGORY_LABELS_SINGULAR } from '../services/elements.js';

const props = defineProps({
  element: { type: Object, required: true },
  /** Cantidad ya presente en la mezcla. */
  quantity: { type: Number, default: 0 },
  /** false cuando se alcanzó el límite de 20 por elemento o 50 átomos. */
  canAdd: { type: Boolean, default: true },
});

const emit = defineEmits(['open', 'add']);

const meta = computed(
  () => `${CATEGORY_LABELS_SINGULAR[props.element.category]} · ${props.element.atomicMass} u`
);
</script>

<template>
  <li class="card">
    <button type="button" class="card__body" @click="emit('open', element.symbol)">
      <span class="card__z mono" aria-hidden="true">{{ element.atomicNumber }}</span>
      <span class="card__text">
        <span class="card__symbol">{{ element.symbol }}</span>
        <span class="card__name">{{ element.name }}</span>
        <span class="card__meta">{{ meta }}</span>
      </span>
    </button>

    <button
      type="button"
      class="card__add"
      :aria-label="`Añadir ${element.name} al laboratorio`"
      :aria-disabled="!canAdd"
      @click="canAdd && emit('add', element.symbol)"
    >
      <span aria-hidden="true">+</span>
      <span v-if="quantity > 0" class="card__count mono" aria-hidden="true">{{ quantity }}</span>
    </button>
  </li>
</template>

<style scoped>
.card {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
}

.card__body {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  min-width: 0;
  min-height: var(--touch);
  padding: 0 var(--sp-2);
  border-radius: var(--r-md);
  text-align: left;
}

.card__body:hover {
  background: var(--surface-3);
}

.card__z {
  flex: none;
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.card__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.card__symbol {
  color: var(--text-1);
  font-size: var(--fs-4);
  font-weight: 700;
  line-height: 1.2;
}

.card__name {
  color: var(--text-2);
  font-size: var(--fs-3);
  line-height: 1.3;
}

.card__meta {
  overflow: hidden;
  color: var(--text-muted);
  font-size: var(--fs-1);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card__add {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  min-width: var(--touch);
  height: var(--touch);
  padding: 0 var(--sp-2);
  border: 1px solid var(--border-input);
  border-radius: var(--r-md);
  background: var(--surface-3);
  color: var(--text-1);
  font-size: var(--fs-4);
}

.card__add:hover {
  border-color: var(--accent);
}

.card__add[aria-disabled='true'] {
  opacity: 0.45;
  cursor: not-allowed;
}

.card__count {
  font-size: var(--fs-2);
  color: var(--accent-soft);
}
</style>
