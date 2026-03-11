import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
// For GitHub Pages: base = '/searchlyst/' (project site)
// For custom domain or root: base = '/'
const base = process.env.GITHUB_PAGES === 'true' ? '/searchlyst/' : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});