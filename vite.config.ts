import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'DevKit Developer Tools',
        short_name: 'DevKit',
        description: 'Kumpulan tools praktis untuk developer dan pekerjaan digital. Berjalan di browser Anda.',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0B0D10',
        theme_color: '#0B0D10',
        categories: ['developer tools', 'utilities', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Hanya aset statis aplikasi yang di-cache (precache). Tidak ada runtimeCaching,
        // sehingga respons API, token, dan data pengguna tidak pernah disimpan service worker.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
    }),
  ],
  worker: { format: 'es' },
  build: { target: 'es2020', sourcemap: false, chunkSizeWarningLimit: 900 },
});
