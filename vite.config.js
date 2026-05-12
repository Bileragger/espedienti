import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  // Treat CDN imports (Firebase, Leaflet) as external — don't bundle them
  build: {
    rollupOptions: {
      input: {
        main:      resolve(__dirname, 'index.html'),
        admin:     resolve(__dirname, 'admin.html'),
        about:     resolve(__dirname, 'about.html'),
        contatti:  resolve(__dirname, 'contatti.html'),
        register:  resolve(__dirname, 'register.html'),
      },
    },
  },
});
