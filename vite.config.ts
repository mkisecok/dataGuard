import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `viteSingleFile` inlines every asset so `pnpm build` emits ONE self-contained
// dist/index.html. That is deliberate: DataGuard's whole promise is that nothing
// leaves the browser, and a tool you can hand over as a single file — openable
// straight from file:// with no server and no install — is much easier to trust
// and to audit than a bundle split across a dozen requests.
export default defineConfig({
  base: './',
  plugins: [svelte(), viteSingleFile()],
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
});
