import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('react-router')) return 'router-vendor';
          if (id.includes('framer-motion') || id.includes('motion-dom')) return 'motion-vendor';
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'chart-vendor';
          if (id.includes('dexie')) return 'db-vendor';
          if (id.includes('lucide-react')) return 'icons-vendor';

          return 'vendor';
        }
      }
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'icon.svg'],
      manifest: {
        name: 'SmartTracker Workout Coach',
        short_name: 'SmartTracker',
        description: 'Offline-first workout tracker with progression engine and volume analysis',
        start_url: '/',
        scope: '/',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'en',
        categories: ['health', 'fitness', 'productivity'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
