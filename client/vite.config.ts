import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // IMPORTANT: Allows access from the Windows host
    port: 5173, // Vite's default dev port
    watch: {
      usePolling: true, // CRITICAL: Enables file change detection via volume mounts
      interval: 100, // Optional: Polling interval in milliseconds
    }
  }
})