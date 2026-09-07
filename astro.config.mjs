// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio definitivo da confermare col cliente (enearoma.it è libero).
const SITE = 'https://enearoma.it';

export default defineConfig({
  site: SITE,
  // Bilingue: italiano di default (senza prefisso), inglese sotto /en/.
  i18n: {
    locales: ['it', 'en'],
    defaultLocale: 'it',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap()],
  build: { inlineStylesheets: 'auto' },
});
