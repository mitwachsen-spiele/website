// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** Das Spiel liegt auf eigener Adresse (mitwachsen-spiele/weltenbummler) */
const GAME = 'https://weltenbummler.mitwachsen-spiele.de/';

export default defineConfig({
  site: 'https://www.mitwachsen-spiele.de',
  trailingSlash: 'ignore',
  // Bilder (auch in Markdown) mit Breite/Höhe, lazy und in passenden Größen (srcset), höchstens so breit wie der Text
  image: { layout: 'constrained' },
  // Alte Adressen gelten für immer (Lesezeichen, installierte Apps): /spielen/ war bis zum Umzug das Spiel. Dort liegt
  // dazu der Ablöse-Service-Worker (public/spielen/sw.js) für Geräte, die noch den alten Stand im Cache haben.
  redirects: { '/spielen': GAME },
  integrations: [sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/spielen') })],
});
