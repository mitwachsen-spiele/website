// Guard-Gate nach dem Build (Teil von npm run verify): Regeln aus CLAUDE.md, die sonst nur Absprache wären.
// – Keine externen Ressourcen ohne Klick auf irgendeiner Seite.
// – Alte Adressen leiten an ihr Ziel weiter, und das Ziel gibt es (eigene Seite) oder liegt auf einem freigegebenen
//   Host (REDIRECT_HOSTS in scripts/dist.ts). Neue Weiterleitungen (Astro `redirects`) gehören hier hinein.
// Logik und Tests: scripts/dist.ts, scripts/dist.test.ts

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { externalResources, redirectProblem, redirectTarget } from './dist.ts';

const DIST = 'dist';
/** Alte Adressen und wohin sie führen müssen */
export const LEGACY: [string, string][] = [
  // Bis zum Umzug lag das Spiel hier; dort liegt dazu für immer der Ablöse-Service-Worker (public/spielen/sw.js)
  ['/spielen/', 'https://weltenbummler.mitwachsen-spiele.de/'],
];

const pagesIn = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? pagesIn(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
  );
const pageFile = (path: string) => join(DIST, path, 'index.html');

const problems: string[] = [];
const pages = pagesIn(DIST);
for (const file of pages)
  for (const r of externalResources(readFileSync(file, 'utf8')))
    problems.push(`${relative(DIST, file)}: externe Ressource ${r}`);
for (const [from, to] of LEGACY) {
  if (!existsSync(pageFile(from))) {
    problems.push(`alte Adresse ${from}: keine Seite`);
    continue;
  }
  const problem = redirectProblem(to, redirectTarget(readFileSync(pageFile(from), 'utf8')), (p) =>
    existsSync(pageFile(p)),
  );
  if (problem) problems.push(`alte Adresse ${from}: ${problem}`);
}

if (problems.length) {
  console.error(`Seiten-Gate: ${problems.length} Verstoß/Verstöße\n` + problems.map((p) => `  ✖ ${p}`).join('\n'));
  process.exit(1);
}
console.log(
  `✓ Seiten-Gate: ${pages.length} Seiten ohne externe Ressourcen, ${LEGACY.length} alte Adressen leiten weiter`,
);
