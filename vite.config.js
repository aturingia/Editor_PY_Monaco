import { defineConfig } from 'vite';

// ⚠️ IMPORTANTE: reemplaza 'Editor_PY_Monaco' con el nombre EXACTO de tu repositorio en GitHub
const REPO_NAME = 'Editor_PY_Monaco';

export default defineConfig({
  // 🔑 base dinámico: raíz en desarrollo, subcarpeta en GitHub Pages
  base: process.env.GITHUB_PAGES === 'true' ? `/${REPO_NAME}/` : '/',

  server: {
    port: 5173,
    open: true
  },
  optimizeDeps: {
    exclude: ['monaco-editor']
  },
  worker: {
    format: 'es'
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor'],
          jszip: ['jszip']
        }
      }
    }
  }
});