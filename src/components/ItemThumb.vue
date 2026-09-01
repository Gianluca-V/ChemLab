<script setup>
/**
 * Miniatura de un elemento o de un compuesto.
 *
 * Tres variantes, en orden de preferencia:
 *   1. Compuesto con imagen de estructura YA cacheada: se pinta la PNG de
 *      PubChem. No dispara ninguna petición nueva — la URL sale de
 *      `cachedImages()` (SPEC 09 §4), así que solo aparece en compuestos que el
 *      usuario ya visitó y que el Service Worker ya tiene.
 *   2. Elemento: el símbolo sobre el tinte de su categoría, el mismo lenguaje
 *      visual de la tabla periódica (SPEC 03).
 *   3. Compuesto sin imagen cacheada: la fórmula con subíndices.
 *
 * Nunca se pide la imagen a la red desde una lista: cien filas serían cien
 * peticiones, y offline la aplicación tiene que seguir mostrando la lista
 * entera (SPEC 09 §5).
 *
 * Es `aria-hidden`: la fila que la contiene ya enuncia nombre y tipo, y
 * anunciarla otra vez duplicaría cada entrada con lector de pantalla.
 */
import { ref, watch } from 'vue';

import ChemFormula from './ChemFormula.vue';

const props = defineProps({
  type: { type: String, required: true },
  /** Símbolo del elemento. Solo en `type: 'element'`. */
  symbol: { type: String, default: '' },
  /** Categoría del elemento, para el tinte. Solo en `type: 'element'`. */
  category: { type: String, default: '' },
  /** Fórmula del compuesto. Solo en `type: 'compound'`. */
  formula: { type: String, default: '' },
  /** URL de la estructura, si ya estaba cacheada. */
  image: { type: String, default: '' },
});

/*
  Una PNG cacheada puede fallar igual —la caché de PubChem vive en localStorage
  y la imagen en Cache Storage, y las dos se vacían por separado—. Si falla, la
  miniatura cae a la fórmula en vez de dejar el ícono roto del navegador.
*/
const imageFailed = ref(false);
watch(() => props.image, () => (imageFailed.value = false));
</script>

<template>
  <!--
    <span> y no <div>: la miniatura se pinta dentro del <button> de la fila, y
    el modelo de contenido de <button> solo admite contenido de frase.
  -->
  <span
    class="thumb"
    :class="type === 'element' ? 'thumb--element' : 'thumb--compound'"
    :style="type === 'element' && category ? { '--cat-hue': `var(--cat-${category})` } : null"
    aria-hidden="true"
  >
    <img
      v-if="type === 'compound' && image && !imageFailed"
      class="thumb__image"
      :src="image"
      alt=""
      loading="lazy"
      decoding="async"
      @error="imageFailed = true"
    />
    <span v-else-if="type === 'element'" class="thumb__symbol">{{ symbol }}</span>
    <ChemFormula v-else class="thumb__formula" :formula="formula" />
  </span>
</template>

<style scoped>
.thumb {
  flex: none;
  display: grid;
  place-items: center;
  width: var(--touch);
  height: var(--touch);
  overflow: hidden;
  padding: 2px;
  border: 1px solid var(--border-2);
  border-radius: var(--r-md);
  background: var(--surface-3);
  color: var(--text-2);
}

.thumb--element {
  background: oklch(0.72 0.09 var(--cat-hue, var(--cat-nm)) / 16%);
}

.thumb__symbol {
  font-size: var(--fs-3);
  font-weight: 600;
}

.thumb__formula {
  font-size: var(--fs-1);
  line-height: 1;
  text-align: center;
}

/*
  La PNG de PubChem trae el trazo en negro, así que la miniatura le pone una
  placa blanca y se ve igual en los dos temas. No se invierte la imagen:
  invertir alteraría los colores con los que PubChem distingue los átomos.
*/
.thumb__image {
  width: 100%;
  height: 100%;
  border-radius: calc(var(--r-md) - 2px);
  background: #fff;
  object-fit: contain;
}
</style>
