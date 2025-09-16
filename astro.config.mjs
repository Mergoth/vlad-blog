// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { remarkPhotoCarousel } from './src/utils/remark-photo-carousel.mjs';

// CASCADE_HINT: Keep config minimal; middleware auto-loads from src/middleware.ts
// CASCADE_TODO: Set your deployed site URL (used for canonical URLs)
// Example: site: 'https://vlad.blog'

// https://astro.build/config
export default defineConfig({
  trailingSlash: 'never',
  site: 'https://vlad-blog.netlify.app', // CASCADE: Netlify auto-domain placeholder
  // CASCADE: Use default static output with hybrid rendering - opt out API routes individually
  adapter: netlify(),
  integrations: [react(), tailwind()],
  markdown: {
    remarkPlugins: [remarkPhotoCarousel],
  },
});
