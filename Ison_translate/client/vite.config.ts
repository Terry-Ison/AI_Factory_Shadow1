import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const apiTarget = 'http://localhost:3001'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: apiTarget,
        ws: true,
        changeOrigin: true,
      },
      '/health': { target: apiTarget, changeOrigin: true },
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
})
