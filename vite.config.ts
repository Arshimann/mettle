import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { APP_NAME, APP_DESCRIPTION } from './src/config'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  define: {
    // Surfaced in Settings → About; the build date advances on every deploy.
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'pwa-192.png', 'pwa-512.png', 'pwa-maskable-512.png'],
      manifest: {
        name: APP_NAME,
        short_name: APP_NAME,
        description: APP_DESCRIPTION,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#060608',
        theme_color: '#060608',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/index.html',
      },
      // Avoid stale service-worker caching while developing.
      devOptions: { enabled: false },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        /**
         * Split the libraries out of the app chunk.
         *
         * Everything used to land in one ~1 MB file, which meant every deploy —
         * a copy fix, a colour tweak — invalidated React, framer-motion and the
         * Supabase client along with it, and the service worker re-downloaded
         * the lot. These four change only when their versions do, so a routine
         * app update now re-fetches app code alone.
         *
         * Supabase is separate for a second reason: nothing imports it until
         * someone signs in, so an offline-only user never pays for it.
         */
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-dom') || id.includes('/react/')) return 'react';
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils'))
            return 'motion';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('@dnd-kit')) return 'dnd';
        },
      },
    },
  },
})
