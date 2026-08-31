<script setup>
/**
 * Estado vacío — SPEC 15 §4
 *
 * Tres partes fijas: ícono, título, explicación de UNA oración, y UNA acción
 * primaria que resuelve la situación. Nada más.
 *
 * La previsualización fantasma es una decisión del diseño que se conserva: el
 * vacío muestra la forma de lo que falta en lugar de un cartel plano. Va con
 * aria-hidden porque es ilustración, no contenido, y sin animación porque no
 * está cargando nada.
 */
defineProps({
  icon: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  /** Cantidad de siluetas fantasma. 0 las desactiva. */
  ghosts: { type: Number, default: 0 },
  /** El encabezado recibe el foco cuando la vista se vacía (SPEC 15 §8). */
  focusable: { type: Boolean, default: false },
});
</script>

<template>
  <div class="empty">
    <p v-if="icon" class="empty__icon" aria-hidden="true">{{ icon }}</p>

    <h2 class="empty__title" :tabindex="focusable ? -1 : undefined">{{ title }}</h2>
    <p v-if="description" class="empty__text">{{ description }}</p>

    <div v-if="$slots.action" class="empty__action">
      <slot name="action" />
    </div>

    <div v-if="ghosts > 0" class="empty__ghosts" aria-hidden="true">
      <div v-for="n in ghosts" :key="n" class="empty__ghost" />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-6) var(--sp-4);
  text-align: center;
}

.empty__icon {
  font-size: var(--fs-7);
  line-height: 1;
}

.empty__title {
  color: var(--text-1);
  font-size: var(--fs-5);
}

.empty__title:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}

.empty__text {
  max-width: 34ch;
  color: var(--text-3);
  font-size: var(--fs-3);
}

.empty__action {
  margin-top: var(--sp-2);
}

.empty__ghosts {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  width: 100%;
  max-width: 32rem;
  margin-top: var(--sp-5);
}

.empty__ghost {
  height: var(--sp-7);
  border-radius: var(--r-lg);
  background: var(--skeleton);
}
</style>
