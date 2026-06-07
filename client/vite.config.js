import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api requests to the Express backend during development.
// This means the frontend calls /api/tasks (same origin) and Vite
// forwards them to http://localhost:3001/api/tasks — no CORS issues
// from the browser's perspective in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
