<script setup>
/**
 * Formulario de contacto — demostración de sessionStorage
 *
 * NO ENVÍA NINGÚN CORREO. No hay servidor, no hay fetch, no hay destinatario.
 * "Enviar" guarda el mensaje en sessionStorage y lo agrega a la lista de abajo:
 * eso es todo lo que ocurre, y la interfaz lo dice antes de que el usuario
 * escriba, no después. Prometer un envío que no existe sería el mismo tipo de
 * afirmación sin respaldo que el proyecto se prohíbe en la copy científica.
 *
 * La validación es de JavaScript, no de atributos HTML: `required` y
 * `type="email"` se saltean desde las herramientas de desarrollo, y además su
 * mensaje nativo no se puede estilar ni traducir. Los atributos igual se
 * declaran —le dan el teclado correcto al teléfono y la semántica al lector de
 * pantalla— pero quien decide es submit().
 *
 * `novalidate` en el <form> apaga la validación nativa para que no se
 * superponga con la nuestra: sin eso, el navegador frena el submit con su
 * propio globo en inglés y el mensaje de error del componente no llega a verse.
 */
import { computed, ref, useId } from 'vue';

import ConfirmSheet from './ConfirmSheet.vue';
import NoteCounter from './NoteCounter.vue';
import { useContactMessages, MAX_MESSAGE_LENGTH } from '../composables/useContactMessages.js';
import { useToast } from '../composables/useToast.js';

const messages = useContactMessages();
const toast = useToast();

const email = ref('');
const subject = ref('');
const message = ref('');

/** Campo que falló la validación, o '' si no falló ninguno. */
const invalidField = ref('');
const error = ref('');

const confirmingClear = ref(false);

const emailId = useId();
const subjectId = useId();
const messageId = useId();
const errorId = useId();

const emailField = ref(null);
const subjectField = ref(null);
const messageField = ref(null);

/*
  Puntos de código, no unidades UTF-16: "🎉".length es 2 en JavaScript y 1 para
  quien escribe. Es el mismo criterio que usa la nota de un favorito.
*/
const messageLength = computed(() => [...message.value].length);

/**
 * Validación de correo deliberadamente PERMISIVA: algo, una arroba, algo, un
 * punto, algo, y sin espacios. No intenta implementar el RFC 5322 —cuya
 * gramática real admite comillas, comentarios y direcciones IP literales— ni
 * decidir si el buzón existe, que es algo que solo se puede saber enviando.
 * Una expresión regular más estricta rechaza direcciones válidas, y ese error
 * es peor: deja afuera a un usuario legítimo sin explicación posible.
 *
 * @param {string} value
 * @returns {boolean}
 */
function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Marca el error, manda el foco al campo que lo causó y corta. Sin el foco, un
 * usuario de teclado lee el mensaje y tiene que volver a tabular hasta el campo
 * adivinando cuál era.
 *
 * @param {string} field
 * @param {{value: HTMLElement|null}} target
 * @param {string} text
 */
function fail(field, target, text) {
  invalidField.value = field;
  error.value = text;
  target.value?.focus();
}

function submit() {
  if (email.value.trim() === '') {
    fail('email', emailField, 'Escribí tu correo para que sepamos de parte de quién es.');
    return;
  }
  if (!looksLikeEmail(email.value.trim())) {
    fail('email', emailField, 'Ese correo no parece válido. Revisá que tenga @ y un punto después.');
    return;
  }
  if (subject.value.trim() === '') {
    fail('subject', subjectField, 'Poné un asunto: en una línea, de qué se trata.');
    return;
  }
  if (message.value.trim() === '') {
    fail('message', messageField, 'Contanos tu mensaje antes de guardarlo.');
    return;
  }
  /*
    El maxlength del textarea ya frena la escritura, pero se valida igual en
    JavaScript: un atributo HTML se saltea desde las herramientas de desarrollo.
  */
  if (messageLength.value > MAX_MESSAGE_LENGTH) {
    fail('message', messageField, `El mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres.`);
    return;
  }

  messages.add({ email: email.value, subject: subject.value, message: message.value });

  invalidField.value = '';
  error.value = '';
  email.value = '';
  subject.value = '';
  message.value = '';

  toast.show({
    type: 'contact-message',
    title: 'Mensaje guardado en esta sesión.',
    detail: 'No se envió ningún correo: se guarda hasta que cierres la pestaña.',
  });

  emailField.value?.focus();
}

function confirmClear() {
  messages.clear();
  confirmingClear.value = false;
  toast.show({
    type: 'contact-cleared',
    title: 'Vaciamos la lista de esta sesión.',
  });
}
</script>

<template>
  <section class="form-card" aria-labelledby="contact-form-heading">
    <h2 id="contact-form-heading">Escribinos</h2>

    <form class="form" novalidate @submit.prevent="submit">
      <div class="form__field">
        <label :for="emailId" class="form__label">Tu correo *</label>
        <input
          :id="emailId"
          ref="emailField"
          v-model="email"
          class="form__control"
          type="email"
          name="email"
          autocomplete="email"
          inputmode="email"
          placeholder="vos@ejemplo.com"
          :aria-invalid="invalidField === 'email'"
          :aria-describedby="invalidField === 'email' ? errorId : undefined"
        />
      </div>

      <div class="form__field">
        <label :for="subjectId" class="form__label">Asunto *</label>
        <input
          :id="subjectId"
          ref="subjectField"
          v-model="subject"
          class="form__control"
          type="text"
          name="subject"
          maxlength="80"
          placeholder="Sobre qué nos escribís"
          :aria-invalid="invalidField === 'subject'"
          :aria-describedby="invalidField === 'subject' ? errorId : undefined"
        />
      </div>

      <div class="form__field">
        <label :for="messageId" class="form__label">Mensaje *</label>
        <textarea
          :id="messageId"
          ref="messageField"
          v-model="message"
          class="form__control form__control--area"
          name="message"
          rows="4"
          :maxlength="MAX_MESSAGE_LENGTH"
          placeholder="Contanos en qué te podemos ayudar"
          :aria-invalid="invalidField === 'message'"
          :aria-describedby="invalidField === 'message' ? errorId : undefined"
        />
        <NoteCounter :value="messageLength" :max="MAX_MESSAGE_LENGTH" :warn-at="450" />
      </div>

      <!--
        El error lleva ícono además de color: el color nunca es el único
        portador de la información.
      -->
      <p v-if="error" :id="errorId" class="form__error" role="alert">
        <span aria-hidden="true">⚠</span>
        <span>{{ error }}</span>
      </p>

      <div class="form__actions">
        <button type="submit" class="btn btn--primary">Guardar mensaje</button>
      </div>
    </form>

    <!--
      La lista es la prueba de que sessionStorage funcionó: sin ella, "guardar"
      no tiene evidencia visible y la demostración no demuestra nada.
    -->
    <div class="sent">
      <div class="sent__head">
        <h3 class="sent__title">
          Mensajes de esta sesión
          <span class="sent__count mono">{{ messages.count.value }}</span>
        </h3>
        <button
          v-if="messages.count.value > 0"
          type="button"
          class="btn btn--inline btn--ghost"
          @click="confirmingClear = true"
        >
          Vaciar
        </button>
      </div>

      <p v-if="messages.count.value === 0" class="sent__empty">
        Todavía no guardaste ninguno. Los que guardes van a aparecer acá hasta que cierres la
        pestaña.
      </p>

      <ul v-else class="sent__list">
        <li v-for="entry in messages.items.value" :key="entry.id" class="sent__item">
          <div class="sent__body">
            <p class="sent__subject">{{ entry.subject }}</p>
            <p class="sent__from mono">{{ entry.email }}</p>
            <p class="sent__text">{{ entry.message }}</p>
          </div>
          <button
            type="button"
            class="sent__delete"
            :aria-label="`Eliminar el mensaje «${entry.subject}»`"
            @click="messages.remove(entry.id)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="m6 6 12 12M18 6 6 18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </li>
      </ul>
    </div>

    <ConfirmSheet
      :open="confirmingClear"
      title="¿Vaciar los mensajes de esta sesión?"
      body="Se borran los mensajes guardados en esta pestaña. La acción no se puede deshacer. Tus favoritos y tu historial no se tocan: viven en otro almacén."
      confirm-label="Vaciar"
      @confirm="confirmClear"
      @close="confirmingClear = false"
    />
  </section>
</template>

<style scoped>
.form-card {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  padding: var(--sp-4);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.form__field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.form__label {
  color: var(--text-hi);
  font-size: var(--fs-2);
  font-weight: 500;
}

.form__control {
  /*
    width: 100% y no `auto`: un <input> trae un tamaño intrínseco de 20
    caracteres que NO se encoge por debajo de eso. Dentro de una grilla, ese
    piso ensancha la columna y desborda la fila en pantallas angostas.
  */
  width: 100%;
  min-height: var(--touch);
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--border-input);
  border-radius: var(--r-md);
  background: var(--surface-3);
  color: var(--text-1);
  font-size: var(--fs-3);
  transition: border-color var(--dur) var(--ease);
}

.form__control--area {
  resize: vertical;
}

.form__control:hover {
  border-color: var(--border-strong);
}

.form__control::placeholder {
  color: var(--text-muted);
}

/* El borde acompaña al mensaje de error, pero no lo reemplaza: por sí solo
   sería color como único portador. */
.form__control[aria-invalid='true'] {
  border-color: var(--hazard);
}

.form__error {
  display: flex;
  gap: var(--sp-2);
  color: var(--hazard-text);
  font-size: var(--fs-2);
}

.form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.sent {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--border);
}

.sent__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.sent__title {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-4);
}

.sent__count {
  padding: 0 var(--sp-2);
  border-radius: var(--r-full);
  background: var(--chip-bg);
  color: var(--text-3);
  font-size: var(--fs-1);
  line-height: 1.7;
}

.sent__empty {
  color: var(--text-muted);
  font-size: var(--fs-2);
}

.sent__list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.sent__item {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface-3);
}

.sent__body {
  min-width: 0;
  flex: 1;
}

.sent__subject {
  color: var(--text-1);
  font-size: var(--fs-3);
  font-weight: 600;
}

.sent__from {
  color: var(--text-muted);
  font-size: var(--fs-1);
}

.sent__text {
  margin-top: var(--sp-1);
  /* Tres líneas y corta: la lista es evidencia de lo guardado, no un lector. */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  color: var(--text-3);
  font-size: var(--fs-2);
}

/* Acción de ícono: piso de 44 px (SPEC 17 §3). */
.sent__delete {
  display: grid;
  place-items: center;
  width: var(--touch);
  height: var(--touch);
  flex: none;
  border-radius: var(--r-md);
  color: var(--text-3);
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease);
}

.sent__delete:hover {
  background: var(--surface-4);
  color: var(--hazard-text);
}

.sent__delete svg {
  width: var(--sp-4);
  height: var(--sp-4);
}
</style>
