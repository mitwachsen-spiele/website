// Die Seiten der Homepage: Startseite (Weg ins Spiel, Aufbau, Handy-Breite), Rechtliches, 404, ohne JavaScript,
// Weiterleitung der alten Spieladresse und Barrierefreiheit. Jede Seite muss ohne Fehler in der Konsole laden
// (pageerror und console.error). Das Spiel selbst liegt in mitwachsen-spiele/weltenbummler.
import { expect, test } from '@playwright/test';
import { violations, watchErrors } from './helpers';

/** Adresse des Spiels: Ziel aller „Spiel starten“-Buttons und der alten Adresse /spielen/ */
const GAME = 'https://weltenbummler.mitwachsen-spiele.de/';

for (const path of ['/', '/datenschutz/'])
  test(`Seite ${path} lädt ohne Fehler`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

test('Startseite führt ins Spiel, oben und am Ende', async ({ page }) => {
  await page.goto('/');
  const cta = page.getByRole('link', { name: 'Spiel starten' });
  await expect(cta).toHaveCount(2);
  for (const n of [0, 1]) await expect(cta.nth(n)).toHaveAttribute('href', GAME);
});

test('Alte Adresse /spielen/ leitet aufs Spiel weiter', async ({ page }) => {
  // Das Spiel liegt auf einem anderen Host; der Test hält die Anfrage dort an, statt ins Netz zu gehen
  await page.route(`${GAME}**`, (route) => route.fulfill({ contentType: 'text/html', body: '<h1>Spiel</h1>' }));
  await page.goto('/spielen/');
  await expect(page).toHaveURL(GAME);
});

test('Startseite: Aufbau, Bild, Footer mit Impressum und Datenschutz', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  expect(await page.getByRole('heading', { level: 2 }).count()).toBeGreaterThanOrEqual(5);
  const shot = page.locator('.shot img');
  await shot.scrollIntoViewIfNeeded();
  await expect.poll(() => shot.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  const footer = page.locator('footer.site-footer');
  // Impressum und Kontakt liegen auf larmic.de, das Impressum dort gilt auch für diese Seite
  await expect(footer.getByRole('link', { name: 'Impressum und Kontakt' })).toHaveAttribute(
    'href',
    'https://larmic.de/impressum/',
  );
  await expect(footer.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute('href', '/datenschutz/');
  // „Mehr für Eltern“ springt zum ersten Abschnitt
  await page.getByRole('link', { name: 'Mehr für Eltern' }).click();
  await expect(page).toHaveURL(/#eltern$/);
});

for (const width of [320, 390, 1280])
  test(`Startseite bei ${width} px ohne seitliches Scrollen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole('link', { name: 'Spiel starten' }).first()).toBeInViewport();
  });

test('Unbekannte Adresse zeigt die 404-Seite', async ({ page }) => {
  const res = await page.goto('/gibt-es-nicht/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: /404/ })).toBeVisible();
});

test.describe('ohne JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('Inhalte bleiben lesbar, das Spiel erklärt sich Eltern', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Mitwachsen' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Spiel starten' }).first()).toHaveAttribute('href', GAME);
  });
});

// Die Homepage ist keine App: kein Manifest, kein Service Worker (den hat nur das Spiel auf seiner eigenen Adresse)
test('Startseite ist keine App und meldet keinen Service Worker an', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('load');
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
  expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((r) => r.length))).toBe(0);
  expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
});

// Barrierefreiheit der ruhenden Seite (reduzierte Bewegung): Mitten im Einblenden misst axe Mischfarben als Kontrast.
test.describe('ruhende Seiten', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  for (const path of ['/', '/datenschutz/', '/gibt-es-nicht/'])
    test(`Barrierefrei: ${path}`, async ({ page }) => {
      await page.goto(path);
      expect(await violations(page)).toEqual([]);
    });

  test('Barrierefrei: Startseite auf dem Handy (320 px)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');
    expect(await violations(page)).toEqual([]);
  });
});
