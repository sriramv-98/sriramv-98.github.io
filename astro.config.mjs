import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// TODO: update `site` to your real custom domain once purchased (e.g. https://sriramvenkatesh.dev)
export default defineConfig({
  site: 'https://sriramv-98.github.io',
  integrations: [sitemap(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
