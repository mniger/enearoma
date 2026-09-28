// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://enearoma.it';

export default defineConfig({
  site: SITE,
  // Bilingue: italiano di default (senza prefisso), inglese sotto /en/.
  i18n: {
    locales: ['it', 'en'],
    defaultLocale: 'it',
    routing: { prefixDefaultLocale: false },
  },
  // Gli hreflang stanno nell'HTML (Base.astro, dalle coppie di `traduzioni`): l'i18n della
  // sitemap accoppia solo percorsi identici e lasciava fuori pranzo/lunch e cocktail/cocktails.
  integrations: [sitemap()],
  build: { inlineStylesheets: 'auto' },
});
