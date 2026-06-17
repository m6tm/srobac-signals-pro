import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  integrations: [svelte()],
  output: 'server',
  adapter: undefined, // Will add Vercel adapter later
  vite: {
    css: {
      transformer: 'lightningcss'
    }
  }
});
