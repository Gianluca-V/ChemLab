import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

// Rutas relativas: la aplicacion se publica como sitio estatico y el router
// trabaja en modo hash (SPEC 01 §1), sin servidor que reescriba rutas.
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      injectRegister: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,woff2,json}'],
      },
      manifest: {
        name: 'ChemLab — Laboratorio químico interactivo',
        short_name: 'ChemLab',
        description: 'Explorá los 118 elementos de la tabla periódica, combinalos y descubrí compuestos reales.',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#0f1116',
        background_color: '#0c0d11',
        orientation: 'any',
        lang: 'es-AR',
        dir: 'ltr',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
