// Ablöse-Service-Worker (public/spielen/sw.js): Ein Gerät, das das Spiel noch unter /spielen/ mit dem alten Service
// Worker kennt, bekommt beim nächsten Update-Check den Ablöse-Worker. Der löscht die Caches, meldet sich ab und lädt
// die Seite neu; dann kommt die Weiterleitung aufs Spiel. Den alten Stand liefert e2e/serve.ts per Cookie `alt=1`.
import { expect, test } from '@playwright/test';

const GAME = 'https://weltenbummler.mitwachsen-spiele.de/';

test('Alter Service Worker unter /spielen/ wird abgelöst, die Seite landet beim Spiel', async ({ page, context }) => {
  await page.route(`${GAME}**`, (route) => route.fulfill({ contentType: 'text/html', body: '<h1>Spiel</h1>' }));
  await context.addCookies([{ name: 'alt', value: '1', url: 'http://localhost:4321' }]);

  // Stand vor dem Umzug: Die alte Seite meldet ihren Worker an, der die Seite in einen Cache legt und übernimmt
  await page.goto('/spielen/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Altes Spiel' })).toBeVisible();
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toMatch(/\/spielen\/sw\.js$/);
  expect(await page.evaluate(() => caches.keys())).toEqual(['mitwachsen-alt']);

  // Umzug: Der Server liefert jetzt den neuen Stand. Der alte Worker würde die Seite weiter aus dem Cache liefern,
  // aber der Update-Check holt den Ablöse-Worker
  await context.clearCookies();
  await page.evaluate(() => navigator.serviceWorker.getRegistration('/spielen/').then((r) => r?.update()));
  await expect(page).toHaveURL(GAME);

  // Zurück auf der Website: kein Worker, kein Cache mehr
  await page.goto('/');
  expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((r) => r.length))).toBe(0);
  expect(await page.evaluate(() => caches.keys())).toEqual([]);
});
