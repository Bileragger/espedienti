import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the site from /espedienti/ — set base so asset paths are correct
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    // Keep for local dev in case historyApiFallback is ever needed
    historyApiFallback: false,
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
