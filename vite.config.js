import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    // Serve index.html for all unknown routes so React Router handles /about, /contatti
    historyApiFallback: true,
  },
  build: {
    rollupOptions: {
      input: {
        main:     resolve(__dirname, 'index.html'),
        admin:    resolve(__dirname, 'admin.html'),
        register: resolve(__dirname, 'register.html'),
      },
    },
  },
});
