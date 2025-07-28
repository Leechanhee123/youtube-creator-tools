import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'chart-vendor': ['recharts'],
          'routing-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
