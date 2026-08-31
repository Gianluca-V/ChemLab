import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Rutas relativas: la aplicacion se publica como sitio estatico y el router
// trabaja en modo hash (SPEC 01 §1), sin servidor que reescriba rutas.
export default defineConfig({
  base: './',
  plugins: [vue()],
});
