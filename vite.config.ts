import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps the build working from any static-host subfolder (e.g. GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
  // Always the same address: saved progress belongs to the address it was played on.
  server: { port: 5188, strictPort: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
