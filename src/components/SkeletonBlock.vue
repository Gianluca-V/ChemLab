<script setup>
/**
 * Estado de carga — SPEC 15 §5, frame 09
 *
 * Skeleton, no spinner, con el texto "Consultando información química…".
 *
 * Solo cubre el bloque atribuido a PubChem: fórmula, nombre, composición y
 * descripción interna se pintan de entrada porque son locales y ya están en
 * memoria. Y no aparece si la caché está vigente: el paso de la mezcla al
 * resultado es inmediato.
 *
 * La silueta coincide en dimensiones con el contenido real para que no haya
 * salto de layout al resolver.
 */
defineProps({
  label: { type: String, default: 'Consultando información química…' },
  lines: { type: Number, default: 4 },
  /** Reserva el espacio de la imagen de estructura molecular. */
  image: { type: Boolean, default: false },
});
</script>

<template>
  <div class="skeleton" role="status" aria-busy="true">
    <p class="skeleton__label">{{ label }}</p>
    <div v-if="image" class="skeleton__image" aria-hidden="true" />
    <div v-for="n in lines" :key="n" class="skeleton__line" aria-hidden="true" />
  </div>
</template>

<style scoped>
.skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.skeleton__label {
  color: var(--text-muted);
  font-size: var(--fs-2);
}

.skeleton__image {
  aspect-ratio: 3 / 2;
  border-radius: var(--r-lg);
  background: var(--skeleton);
  animation: pulse 1.6s ease-in-out infinite;
}

.skeleton__line {
  height: var(--sp-4);
  border-radius: var(--r-sm);
  background: var(--skeleton);
  animation: pulse 1.6s ease-in-out infinite;
}

.skeleton__line:nth-child(even) {
  width: 78%;
}

.skeleton__line:last-child {
  width: 54%;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}
</style>
