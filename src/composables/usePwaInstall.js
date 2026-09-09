import { ref } from 'vue';

const canInstall = ref(false);
let deferredPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    canInstall.value = true;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    canInstall.value = false;
  });
}

async function promptInstall() {
  if (!deferredPrompt) return;
  const prompt = deferredPrompt;
  deferredPrompt = null;
  canInstall.value = false;
  await prompt.prompt();
}

export function usePwaInstall() {
  return { canInstall, promptInstall };
}
