import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permet l'accès depuis votre smartphone sur le même réseau Wi-Fi
    port: 5173,
  },
})
