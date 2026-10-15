import { defineConfig } from 'vite';

// ⚠️ CAMBIA ESTO por el nombre EXACTO de tu repositorio en GitHub
// (case-sensitive, tal cual aparece en la URL: github.com/TU-USUARIO/XXXXX)
const REPO_NAME = 'Editor_PY_Monaco';

export default defineConfig({
  // GitHub Actions define GITHUB_ACTIONS=true automáticamente
  base: process.env.GITHUB_ACTIONS ? `/${REPO_NAME}/` : '/',

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