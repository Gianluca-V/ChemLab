<script setup>
/**
 * Contacto — frame 18; SPEC 13 §B
 *
 * El correo y el teléfono siguen siendo ficticios (SPEC 13 §B.1): no
 * corresponden a una persona real. Los tres enlaces sí son reales —mailto:,
 * tel: y el mapa— porque el mecanismo es lo que la consigna evalúa.
 *
 * La UBICACIÓN, en cambio, es la de verdad: Universidad Nacional Arturo
 * Jauretche, Av. Calchaquí 6200, Florencio Varela. El documento de diseño decía
 * "La Plata" en la tarjeta mientras el mapa y las coordenadas ya apuntaban a la
 * UNAJ: la tarjeta contradecía al mapa que tenía al lado. Se unifica en la UNAJ,
 * que es la institución de la materia.
 *
 * El formulario del costado NO ENVÍA CORREOS: guarda en sessionStorage. Ver
 * ContactForm.vue.
 *
 * Sin <h1>: el único de la página lo pone el TopBar (SPEC 17 §9).
 */
import ContactForm from '../components/ContactForm.vue';
import MapEmbed from '../components/MapEmbed.vue';
</script>

<template>
  <div class="contact">
    <div class="contact__info">
      <address class="contact__card">
        <p>ChemLab · Universidad Nacional Arturo Jauretche</p>
        <p>Aplicaciones Móviles · Florencio Varela, Buenos Aires</p>
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
          Av. Calchaquí 6200, Florencio Varela
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

    <ContactForm />
  </div>
</template>

<style scoped>
/*
  Una columna hasta 1023 px, dos desde ahí: los datos y el mapa a la izquierda,
  el formulario al costado.

  El breakpoint es 1024 y no 768 a propósito. A 768–1023 px la vista tiene el
  ancho entero —Contacto lleva `meta.panel: false`, así que no comparte con el
  panel del laboratorio—, pero dos columnas de ~350 px dejan al mapa de 4:3 en
  260 px de alto y al formulario con campos de 300 px. Cada mitad necesita unos
  400 px para respirar, y recién a 1024 los hay.
*/
.contact {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--sp-4);
  max-width: 34rem;
}

.contact__info {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  min-width: 0;
}

@media (min-width: 1024px) {
  .contact {
    /* `align-items: start` para que la columna corta no se estire al alto de
       la larga: sin eso, la tarjeta de datos crece con el formulario. */
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: var(--sp-5);
    max-width: 72rem;
  }
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
