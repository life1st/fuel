import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { analyzer } from 'vite-bundle-analyzer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: 'script-defer',
      registerType: 'autoUpdate',
      manifest: {
        name: 'Fuel',
        short_name: 'Fuel',
        description: 'Yet another Fuel statistics App',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icons/icon.svg',
            sizes: '192x192',
            type: 'image/svg',
          },
          {
            src: 'icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg',
          },
        ],
        start_url: '/fuel',
        display: 'standalone',
        background_color: '#ffffff',
      },
      devOptions: {
        enabled: true,
        type: 'module'
      },
      strategies: 'generateSW',
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/fuel/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              cacheableResponse: {
                statuses: [200]
              }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          },
          {
            urlPattern: ({ request }) => 
              request.destination === 'image' || 
              request.destination === 'font' ||
              request.destination === 'manifest',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*'],
    }),
    // analyzer(),
  ],
  css: {
    preprocessorOptions: {
      scss: {}
    }
  },
  resolve: {
    alias: [
      { find: '@', replacement: '/src' }
    ]
  },
  server: {
    host: '0.0.0.0'
  },
  base: '/fuel/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
    },
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
  },
})
