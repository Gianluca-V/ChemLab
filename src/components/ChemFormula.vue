<script setup>
/**
 * Fórmula química con subíndices reales.
 *
 * Los subíndices son presentación: el dato viaja en ASCII para que la URL sea
 * escribible y el valor comparable (SPEC 02 §2.1). Este componente los aplica
 * al pintar, con <sub> real, y enuncia la fórmula en palabras en el aria-label
 * para que un lector de pantalla no lea "hache dos o" (SPEC 06 §6).
 *
 * No figura en la lista de componentes de SPEC 00 §3. Existe para no repetir el
 * mismo marcado en las seis vistas que muestran una fórmula.
 */
import { computed } from 'vue';
import { formulaParts, spokenFormula } from '../services/chemistry.js';

const props = defineProps({
  formula: { type: String, required: true },
  /** Nombre del compuesto, para completar el enunciado accesible. */
  name: { type: String, default: '' },
});

const parts = computed(() => formulaParts(props.formula));
const label = computed(() =>
  props.name
    ? `${spokenFormula(props.formula)}, ${props.name}`
    : spokenFormula(props.formula)
);
</script>

<template>
  <span class="formula" :aria-label="label">
    <template v-for="(part, index) in parts" :key="index">
      <sub v-if="part.sub" aria-hidden="true">{{ part.text }}</sub>
      <span v-else aria-hidden="true">{{ part.text }}</span>
    </template>
  </span>
</template>

<style scoped>
.formula {
  font-family: var(--font-mono);
  font-weight: 600;
  white-space: nowrap;
}

sub {
  font-size: 0.7em;
  vertical-align: baseline;
  position: relative;
  bottom: -0.22em;
}
</style>
