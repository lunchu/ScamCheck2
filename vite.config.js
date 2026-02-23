import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ScamCheck2/',
  server: {
    port: 3000,
    open: true
  }
})
