import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
// For GitHub Pages: base = '/searchlyst/' (project site)
// For custom domain or root: base = '/'
const base = process.env.GITHUB_PAGES === 'true' ? '/searchlyst/' : '/';

export default defineConfig({
  base,
  // Use hostname "localhost" so http://localhost:5173 matches backend FRONTEND_URL / CORS (not only 127.0.0.1).
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    // Same-origin /api in dev → no CORS issues (localhost vs 127.0.0.1 vs [::1])
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});