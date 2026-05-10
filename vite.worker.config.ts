// vite.worker.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    sourcemap: 'inline',
    target: 'node16',
    outDir: '.vite/build',
    rollupOptions: {
      external: ['electron'],
    },
    lib: {
      entry: 'src/workers/worker.ts',
      formats: ['cjs'],
      fileName: () => '[name].js',
    },
    emptyOutDir: false,
  },
});
