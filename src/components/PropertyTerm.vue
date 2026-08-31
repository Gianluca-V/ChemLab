<script setup>
/**
 * Término con definición emergente — usado en la ficha de compuesto
 *
 * Un usuario que no es químico lee "InChIKey" y no tiene de dónde agarrarse.
 * Este componente pone la definición a un toque o a un hover de distancia, sin
 * sacarlo de la pantalla ni mandarlo a una ayuda aparte.
 *
 * NO es un `title=`. El atributo nativo no aparece con teclado, no se puede
 * descartar, tarda un segundo largo en salir y en táctil directamente no
 * existe. Sirve para el `<iframe>` del mapa (SPEC 17), no para esto.
 *
 * Accesibilidad — WCAG 1.4.13, contenido en hover o foco:
 *   · El disparador es un <button>, nunca un <span> con handler.
 *   · Se abre con hover, con foco de teclado y con toque. El hover no es la
 *     única vía: en un teléfono no hay hover.
 *   · DESCARTABLE: Escape lo cierra sin mover el foco.
 *   · SOSTENIDO: no se cierra solo por tiempo.
 *   · APUNTABLE: el globo vive dentro del mismo contenedor que escucha el
 *     mouseleave, así que se puede pasar el puntero por encima —para
 *     seleccionar el texto— sin que se escape.
 *
 * El subrayado punteado es el que carga la señal de "esto tiene definición".
 * El color no alcanza: la regla del proyecto es que nunca sea el único
 * portador de información.
 */
import { ref, useId } from 'vue';

defineProps({
  /** Etiqueta visible. Es también el término que se define. */
  term: { type: String, required: true },
  /** Definición en español, en una o dos oraciones. */
  definition: { type: String, required: true },
});

const open = ref(false);
/** Vue 3.5+. Dos fichas en pantalla no pueden compartir el id del globo. */
const popoverId = useId();

function show() {
  open.value = true;
}

function hide() {
  open.value = false;
}
</script>

<template>
  <span class="term" @mouseenter="show" @mouseleave="hide">
    <button
      type="button"
      class="term__trigger"
      :aria-describedby="open ? popoverId : undefined"
      :aria-expanded="open"
      @click="open = !open"
      @focus="show"
      @blur="hide"
      @keydown.esc="hide"
    >
      {{ term }}
    </button>

    <!--
      role="tooltip" con aria-describedby: el lector de pantalla lo anuncia
      como descripción del botón, no como una región aparte que haya que ir a
      buscar. v-show y no v-if para que el id exista antes de que
      aria-describedby lo referencie.
    -->
    <span v-show="open" :id="popoverId" class="term__popover" role="tooltip">
      {{ definition }}
    </span>
  </span>
</template>

<style scoped>
.term {
  position: relative;
  display: inline-block;
}

.term__trigger {
  display: inline-flex;
  align-items: center;
  /* Piso táctil de las acciones en línea (SPEC 17 §3). */
  min-height: var(--touch-inline);
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
  cursor: help;
}

.term__trigger:hover {
  color: var(--text-hi);
}

.term__popover {
  position: absolute;
  top: 100%;
  inset-inline-start: 0;
  z-index: 1;
  width: max-content;
  max-width: min(20rem, 70vw);
  margin-top: var(--sp-1);
  padding: var(--sp-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-md);
  background: var(--surface-3);
  box-shadow: var(--shadow-2);
  color: var(--text-2);
  font-size: var(--fs-2);
  line-height: 1.45;
  /* El globo es prosa: no hereda el tratamiento de etiqueta del disparador. */
  text-transform: none;
  letter-spacing: normal;
}
</style>
