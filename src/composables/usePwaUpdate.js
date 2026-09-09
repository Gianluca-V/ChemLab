import { ref } from 'vue';

const updateAvailable = ref(false);
let waitingWorker = null;
let reloaded = false;

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      waitingWorker = registration.waiting;
      updateAvailable.value = true;
    }

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;

      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          waitingWorker = registration.waiting;
          updateAvailable.value = true;
        }
      });
    });
  });

}

function applyUpdate() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  }

  waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
}

export function usePwaUpdate() {
  return { updateAvailable, applyUpdate };
}
