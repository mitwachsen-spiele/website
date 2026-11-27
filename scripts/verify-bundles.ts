// Guard-Gate nach dem Build (Teil von npm run verify): Die Seiten bleiben schnell und ohne Ballast.
// Die Startseite lädt gar kein JavaScript, weder als Datei noch eingebettet. Keine Seite lädt Spielcode, Three.js oder
// meldet einen Service Worker an (den Ablöse-Worker unter /spielen/sw.js lädt keine Seite, nur ein alter Browser beim
// Update-Check), und jede bleibt unter einem festen Budget.
// Logik und Tests: scripts/bundles.ts, scripts/bundles.test.ts

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { check, type Rule } from './bundles.ts';

const DIST = 'dist';
// Spielcode, Three.js und die Anmeldung eines Service Workers
const GAME_CODE = /larmic-mitwachsen|WebGLRenderer|three\.module|serviceWorker/;

export const RULES: Rule[] = [
  // Die Startseite holt kein JavaScript: keine Datei, kein eingebettetes Skript (Budget 0)
  { name: 'Startseite ohne JavaScript', pages: /^index\.html$/, budget: 0, forbidden: GAME_CODE },
  { name: 'Seiten ohne Spiel', pages: /./, budget: 32 * 1024, forbidden: GAME_CODE },
];

const pagesIn = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? pagesIn(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
  );

const read = (path: string) => {
  try {
    return readFileSync(join(DIST, path), 'utf8');
  } catch {
    return null;
  }
};

const pages = pagesIn(DIST);
const problems = pages.flatMap((file) => check(relative(DIST, file), readFileSync(file, 'utf8'), read, RULES));
if (problems.length) {
  console.error(`Bundle-Gate: ${problems.length} Verstoß/Verstöße\n` + problems.map((p) => `  ✖ ${p}`).join('\n'));
  process.exit(1);
}
console.log(`✓ Bundle-Gate: ${pages.length} Seiten geprüft, Startseite ohne JavaScript, keine Seite mit Spielcode`);
