import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Igual ao treinamento-react: tudo que começa com /api é encaminhado
// para o back-end na porta 3000. Assim o front chama "/api/membros"
// sem se preocupar com endereço do servidor nem com CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
    },
  },
})
