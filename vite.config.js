import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Modo normal: app de Vite con three desde npm.
// Modo "artifact": un solo HTML con three cargado desde CDN (lo usa scripts/to-artifact.mjs).
export default defineConfig(({ mode }) =>
  mode === 'artifact'
    ? {
        plugins: [viteSingleFile()],
        build: {
          outDir: 'dist-artifact',
          rollupOptions: {
            external: ['three'],
            output: { format: 'iife', globals: { three: 'THREE' } },
          },
        },
      }
    : { build: { chunkSizeWarningLimit: 800 } }
);
