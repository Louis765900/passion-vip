import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Passion VIP',
        short_name: 'PassionVIP',
        description: 'L\'application de pronostics sportifs par IA',
        theme_color: '#0F172A',
        background_color: '#0F172A',
        display: 'standalone', // C'est ça qui enlève la barre d'URL !
        orientation: 'portrait',
        icons: [
          {
            src: 'logo.png', // On va ajouter cette image juste après
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})