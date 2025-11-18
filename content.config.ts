import { defineCollection, defineContentConfig } from '@nuxt/content';

export default defineContentConfig({
  // Register a default collection so Nuxt Content stops warning
  // and will pick up any future markdown/data you add under /content.
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**',
    }),
  },
});
