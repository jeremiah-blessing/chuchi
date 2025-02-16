import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';

// https://vite.dev/config/
export default defineConfig({
  // @ts-ignore
  plugins: [react()],
  resolve: {
    dedupe: ['vscode'],
  },
  optimizeDeps: {
    esbuildOptions: {
      // @ts-ignore
      plugins: [importMetaUrlPlugin],
    },
  },
  base: '/chuchi',
});
