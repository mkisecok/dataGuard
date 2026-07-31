import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/vite-plugin-svelte').SvelteConfig} */
export default {
  // Enables <script lang="ts"> and TypeScript inside .svelte files.
  preprocess: vitePreprocess(),
};
