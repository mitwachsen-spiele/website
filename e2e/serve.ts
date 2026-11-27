// Statischer Server für die fertige Seite (dist/) – für den Smoke-Test im Browser, ohne Astro.
// Ordner liefern ihre index.html, Unbekanntes die 404-Seite mit Status 404 (wie GitHub Pages).
// Für den Test des Ablöse-Service-Workers (e2e/retire.spec.ts) gibt es unter /spielen/ den alten Stand: Mit dem Cookie
// `alt=1` liefert der Server einem Browser-Kontext die Dateien aus e2e/fixtures/alt-spielen/ (eine Seite, die einen
// Service Worker wie das alte Spiel anmeldet), so als wäre die Seite noch nicht umgezogen. Ohne Cookie dist/.
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.PORT ?? 4321);
const DIST = 'dist';
const ALT = 'e2e/fixtures/alt-spielen';
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.json': 'application/json',
  '.txt': 'text/plain',
};

/** Datei für diesen Aufruf: der alte Stand unter /spielen/ bei Cookie `alt=1`, sonst dist/ */
function file(req: IncomingMessage, path: string): string {
  const alt = /(?:^|;\s*)alt=1/.test(req.headers.cookie ?? '');
  if (alt && path.startsWith('/spielen/')) return join(ALT, path.slice('/spielen/'.length));
  return join(DIST, path);
}

async function serve(req: IncomingMessage, res: ServerResponse) {
  let path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
  if (path.includes('..')) path = '/';
  if (path.endsWith('/')) path += 'index.html';
  try {
    const body = await readFile(file(req, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    res.end(await readFile(join(DIST, '404.html')).catch(() => 'Nicht gefunden'));
  }
}

createServer((req, res) => void serve(req, res)).listen(PORT, () =>
  console.log(`${DIST}/ auf http://localhost:${PORT}`),
);
