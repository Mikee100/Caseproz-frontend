import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { prerenderDevPlugin } from './vite-plugin-prerender.js'

export default defineConfig({
    server: {
      port: 3000,
      host: 'localhost',
    },
  plugins: [react(), prerenderDevPlugin()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
})
