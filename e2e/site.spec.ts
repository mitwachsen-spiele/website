// Die Seiten der Homepage: Startseite (Spielauswahl), Detailseiten der Spiele (Weg ins Spiel, Aufbau, Handy-Breite),
// Rechtliches, 404, ohne JavaScript, Weiterleitung der alten Spieladresse und Barrierefreiheit. Jede Seite muss ohne
// Fehler in der Konsole laden (pageerror und console.error). Die Spiele selbst liegen in eigenen Repos.
import { expect, test } from '@playwright/test';
import { violations, watchErrors } from './helpers';

/** Die Spiele: Detailseite hier, Adresse des Spiels als Ziel von „Spiel starten“ */
const GAMES = [
  { name: 'Weltenbummler', page: '/weltenbummler/', url: 'https://weltenbummler.mitwachsen-spiele.de/' },
  { name: 'Kistenschieber', page: '/kistenschieber/', url: 'https://kistenschieber.mitwachsen-spiele.de/' },
];
const PAGES = ['/', ...GAMES.map((g) => g.page), '/datenschutz/'];

for (const path of PAGES)
  test(`Seite ${path} lädt ohne Fehler`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect(errors).toEqual([]);
  });

test('Startseite: je Spiel eine Karte mit genau einem Link auf seine Detailseite, kein Start von hier', async ({
  page,
}) => {
  await page.goto('/');
  const cards = page.locator('.game-card');
  await expect(cards).toHaveCount(GAMES.length);
  for (const [n, g] of GAMES.entries()) {
    const card = cards.nth(n);
    await expect(card.getByRole('link')).toHaveCount(1);
    await expect(card.getByRole('link', { name: g.name })).toHaveAttribute('href', g.page);
    // Der Steckbrief stellt bei jedem Spiel dieselben Fragen
    await expect(card.locator('dt')).toHaveText(['Alter', 'Mit wem', 'Lesen', 'Gerät', 'Stand']);
    const img = card.locator('img.scene');
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  }
  await expect(page.getByRole('link', { name: 'Spiel starten' })).toHaveCount(0);
  // Der Hinweis auf weitere Spiele ist kein Link
  await expect(page.locator('.seed a')).toHaveCount(0);
});

// Echter Mausklick an der Stelle: Der Link spannt sich über die ganze Karte, nichts darf ihn verdecken. Vorher die Maus
// darüber bewegen, denn „Ansehen“ hebt sich beim Überfahren an.
for (const part of ['.see', '.game-pic', '.steckbrief'])
  test(`Startseite: Klick auf ${part} einer Karte führt zur Detailseite`, async ({ page }) => {
    for (const [n, g] of GAMES.entries()) {
      await page.goto('/');
      const el = page.locator('.game-card').nth(n).locator(part);
      await el.scrollIntoViewIfNeeded();
      const box = await el.boundingBox();
      if (!box) throw new Error(`${part} ohne Fläche`);
      const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
      await page.mouse.move(x, y);
      await page.mouse.click(x, y);
      await expect(page).toHaveURL(new RegExp(`${g.page}$`));
    }
  });

test('Startseite: alter Anker #eltern führt zu „Für Eltern“, von dort weiter zu Weltenbummler', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Mehr für Eltern' }).click();
  await expect(page).toHaveURL(/\/#eltern$/);
  await expect(page.locator('#eltern').getByRole('heading', { level: 2, name: 'Für Eltern' })).toBeVisible();
  await expect(page.locator('#eltern').getByRole('link').first()).toHaveAttribute('href', '/weltenbummler/#eltern');
});

for (const g of GAMES)
  test(`${g.page}: führt ins Spiel, oben und am Ende, und zurück zu allen Spielen`, async ({ page }) => {
    await page.goto(g.page);
    await expect(page.getByRole('heading', { level: 1, name: g.name })).toBeVisible();
    const cta = page.getByRole('link', { name: 'Spiel starten' });
    await expect(cta).toHaveCount(2);
    for (const n of [0, 1]) await expect(cta.nth(n)).toHaveAttribute('href', g.url);
    await expect(page.getByText(`öffnet ${new URL(g.url).host}`)).toBeVisible();
    await expect(page.locator('#eltern')).toHaveCount(1);
    expect(await page.getByRole('heading', { level: 2 }).count()).toBeGreaterThanOrEqual(4);
    const shot = page.locator('.shot img');
    await shot.scrollIntoViewIfNeeded();
    await expect.poll(() => shot.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    // Die anderen Spiele stehen am Ende
    for (const other of GAMES.filter((o) => o !== g))
      await expect(page.locator('.also').getByRole('link', { name: other.name })).toHaveAttribute('href', other.page);
    await page.getByRole('link', { name: 'Alle Spiele' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

test('Weltenbummler: „Mehr für Eltern“ springt zum ersten Abschnitt', async ({ page }) => {
  await page.goto('/weltenbummler/');
  await page.getByRole('link', { name: 'Mehr für Eltern' }).click();
  await expect(page).toHaveURL(/\/weltenbummler\/#eltern$/);
});

test('Footer mit Impressum und Datenschutz', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer.site-footer');
  // Impressum und Kontakt liegen auf larmic.de, das Impressum dort gilt auch für diese Seite
  await expect(footer.getByRole('link', { name: 'Impressum und Kontakt' })).toHaveAttribute(
    'href',
    'https://larmic.de/impressum/',
  );
  await expect(footer.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute('href', '/datenschutz/');
});

test('Alte Adresse /spielen/ leitet aufs Spiel weiter', async ({ page }) => {
  const game = GAMES[0]!.url;
  // Das Spiel liegt auf einem anderen Host; der Test hält die Anfrage dort an, statt ins Netz zu gehen
  await page.route(`${game}**`, (route) => route.fulfill({ contentType: 'text/html', body: '<h1>Spiel</h1>' }));
  await page.goto('/spielen/');
  await expect(page).toHaveURL(game);
});

for (const width of [320, 390, 1280]) {
  test(`Startseite bei ${width} px ohne seitliches Scrollen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
  for (const g of GAMES)
    test(`${g.page} bei ${width} px ohne seitliches Scrollen, „Spiel starten“ im ersten Bild`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(g.page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await expect(page.getByRole('link', { name: 'Spiel starten' }).first()).toBeInViewport();
    });
}

test('Unbekannte Adresse zeigt die 404-Seite', async ({ page }) => {
  const res = await page.goto('/gibt-es-nicht/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: /404/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Alle Spiele' })).toHaveAttribute('href', '/');
});

test.describe('ohne JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('Inhalte bleiben lesbar, Auswahl und Start funktionieren als Links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Mitwachsen-Spiele' })).toBeVisible();
    await page.getByRole('link', { name: GAMES[0]!.name, exact: true }).click();
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Spiel starten' }).first()).toHaveAttribute('href', GAMES[0]!.url);
  });
});

// Die Homepage ist keine App: kein Manifest, kein Service Worker (den hat jedes Spiel auf seiner eigenen Adresse)
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

  for (const path of [...PAGES, '/gibt-es-nicht/'])
    test(`Barrierefrei: ${path}`, async ({ page }) => {
      await page.goto(path);
      expect(await violations(page)).toEqual([]);
    });

  for (const path of ['/', ...GAMES.map((g) => g.page)])
    test(`Barrierefrei: ${path} auf dem Handy (320 px)`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(path);
      expect(await violations(page)).toEqual([]);
    });
});
