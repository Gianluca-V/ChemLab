<script setup>
/**
 * Contacto — frame 18; SPEC 13 §B
 *
 * Datos ficticios del documento de diseño, conservados tal cual (SPEC 13
 * §B.1): no corresponden a una organización ni a una persona real. Los tres
 * enlaces sí son reales — mailto:, tel: y el mapa — porque el mecanismo es lo
 * que la consigna evalúa.
 *
 * Sin <h1>: el único de la página lo pone el TopBar (SPEC 17 §9).
 */
import MapEmbed from '../components/MapEmbed.vue';
</script>

<template>
  <div class="contact">
    <address class="contact__card">
      <p>ChemLab Studio</p>
      <p>Desarrollo frontend · La Plata, Argentina</p>
      <p>
        <span aria-hidden="true">✉</span>
        <a href="mailto:hola@chemlab.dev">hola@chemlab.dev</a>
      </p>
      <p>
        <span aria-hidden="true">☎</span>
        <a href="tel:+5491155550142">+54 9 11 5555-0142</a>
      </p>
      <p>
        <span aria-hidden="true">📍</span>
        Calle 14 y 51, La Plata
      </p>
    </address>

    <section class="contact__location" aria-labelledby="ubicacion">
      <h2 id="ubicacion">Ubicación</h2>
      <MapEmbed />

      <!--
        Las coordenadas se muestran como texto además de aparecer en el mapa:
        es dato verificable sin depender de que el mapa cargue (SPEC 13 §B.3).
      -->
      <p class="contact__coords mono">
        Universidad Nacional Arturo Jauretche · −34.7750, −58.2678
      </p>

      <!--
        rel="noopener noreferrer" no es decorativo: sin noopener, la página de
        destino puede manipular la nuestra a través de window.opener.
      -->
      <a
        class="btn btn--ghost contact__map-link"
        href="https://www.openstreetmap.org/?mlat=-34.7750&amp;mlon=-58.2678#map=17/-34.7750/-58.2678"
        target="_blank"
        rel="noopener noreferrer"
      >
        Ver mapa
        <span class="visually-hidden">(se abre en una pestaña nueva)</span>
      </a>
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

.contact__location {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
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

.contact__map-link {
  align-self: flex-start;
  margin-top: var(--sp-3);
}

.contact__coords {
  margin-top: var(--sp-2);
  color: var(--text-muted);
  font-size: var(--fs-1);
}
</style>
