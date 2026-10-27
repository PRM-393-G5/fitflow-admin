import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // antd's shared core is ~770 kB minified (~250 kB gzip); pages are
    // split into their own chunks by the routes' lazy imports.
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // antd forms are slow to drive in jsdom.
    testTimeout: 20_000,
  },
});
