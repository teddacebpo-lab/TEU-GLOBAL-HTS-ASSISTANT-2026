import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // ✅ MUST match repo name EXACTLY (case-sensitive)
  base: '/TEU-GLOBAL-HTS-ASSISTANT-2026/',

  plugins: [react()],

  server: {
    port: 3000,
    host: '0.0.0.0',
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
