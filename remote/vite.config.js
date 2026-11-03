import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';

export default defineConfig({
  base: '/remote/',
  plugins: [
    federation({
      name: 'remote',
      filename: 'remoteEntry.js',
      manifest: true,
      exposes: { './widget': './src/widget.js' },
      shared: { 'shared-elements': { singleton: true } },
      dts: false,
    }),
  ],
  build: { target: 'esnext' },
  preview: { port: 4174, strictPort: true },
});
