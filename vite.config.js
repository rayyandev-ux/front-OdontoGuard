import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    host: true,
    port: 8080,
    strictPort: true,
    allowedHosts: ['odontokaren-front-odontokaren.eis2pk.easypanel.host']
  }
})
