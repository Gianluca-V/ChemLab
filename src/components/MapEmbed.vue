<script setup>
/**
 * Mapa de la ubicación de contacto — SPEC 13 §B.3, §B.4
 *
 * <iframe> de OpenStreetMap. Sin Leaflet, sin Google Maps, sin ninguna
 * dependencia externa (la consigna lo permite pero pide evitar librerías de UI).
 *
 * Un <iframe> cross-origin no se puede cachear con el Service Worker: offline
 * mostraría la página de error del navegador dentro del marco. Se evita sin
 * montar el <iframe> cuando navigator.onLine es false, y en su lugar se
 * renderiza un bloque estático con la misma relación de aspecto, para que el
 * layout no salte al recuperar la conexión.
 */
import { ref } from 'vue';

const LAT = -34.9215;
const LON = -57.9536;
const DELTA = 0.01;
const BBOX = `${LON - DELTA},${LAT - DELTA},${LON + DELTA},${LAT + DELTA}`;
const MAP_SRC = `https://www.openstreetmap.org/export/embed.html?bbox=${BBOX}&marker=${LAT},${LON}`;

const online = ref(navigator.onLine);
window.addEventListener('online', () => (online.value = true));
window.addEventListener('offline', () => (online.value = false));
</script>

<template>
  <div class="map">
    <iframe
      v-if="online"
      title="Mapa de la Catedral de La Plata"
      :src="MAP_SRC"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
    />
    <div v-else class="map__offline">
      <p class="map__icon" aria-hidden="true">📍</p>
      <p>El mapa necesita conexión.</p>
      <p class="mono">Catedral de La Plata</p>
      <p class="mono">−34.9215, −57.9536</p>
    </div>
  </div>
</template>

<style scoped>
.map {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
}

.map iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.map__offline {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  background: var(--surface-2);
  color: var(--text-3);
  font-size: var(--fs-2);
  text-align: center;
}

.map__icon {
  font-size: var(--fs-6);
}
</style>
