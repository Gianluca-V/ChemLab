<script setup>
/**
 * Contacto — frame 18; SPEC 13 §B
 *
 * Datos ficticios del documento de diseño, conservados tal cual (SPEC 13
 * §B.1): no corresponden a una organización ni a una persona real. Los tres
 * enlaces sí son reales — mailto:, tel: y el mapa — porque el mecanismo es lo
 * que la consigna evalúa.
 */
import MapEmbed from '../components/MapEmbed.vue';
</script>

<template>
  <div class="contact">
    <h1>Contacto</h1>

    <address class="contact__card">
      <p>ChemLab Studio</p>
      <p>Desarrollo frontend · La Plata, Argentina</p>
      <p>
        <span aria-hidden="true">✉</span>
        <a href="mailto:hola@chemlab.dev">hola@chemlab.dev</a>
      </p>
      <p>
        <span aria-hidden="true">☎</span>
        <a href="tel:+542215550142">+54 221 555 0142</a>
      </p>
      <p>
        <span aria-hidden="true">📍</span>
        Calle 14 y 51, La Plata
      </p>
    </address>

    <section aria-labelledby="ubicacion">
      <h2 id="ubicacion">Ubicación</h2>
      <MapEmbed />
      <p class="contact__coords mono">Catedral de La Plata · −34.9215, −57.9536</p>
    </section>
  </div>
</template>

<style scoped>
.contact {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  max-width: 34rem;
}

.contact__card {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-4);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  background: var(--surface-2);
  font-style: normal;
}

.contact__card p {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  color: var(--text-2);
  font-size: var(--fs-3);
}

.contact__coords {
  margin-top: var(--sp-2);
  color: var(--text-muted);
  font-size: var(--fs-1);
}
</style>
