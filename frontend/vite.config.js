import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    host: '0.0.0.0',
    allowedHosts: ['.vercel.run', 'localhost', '127.0.0.1'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
