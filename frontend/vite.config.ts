import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',  // Flask 서버 포트
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
