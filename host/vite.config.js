import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';

// The remote is served from its own preview server and proxied under /remote/,
// so host and remote share an origin.
const proxy = { '/remote/': 'http://localhost:4174' };

export default defineConfig({
  plugins: [
    federation({
      name: 'host',
      remotes: {
        remote: {
          type: 'module',
          name: 'remote',
          entry: '/remote/mf-manifest.json',
        },
      },
      shared: { 'shared-elements': { singleton: true } },
      shareStrategy: 'version-first',
      dts: false,
    }),
  ],
  build: { target: 'esnext' },
  server: { port: 4173, strictPort: true, proxy },
  preview: { port: 4173, strictPort: true, proxy },
});
