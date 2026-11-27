import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { GAME_URL, HOME_TITLE, SITE, SKY_1, SKY_2, homeLd } from './site';

describe('Daten für Suchmaschinen', () => {
  it('Titel der Startseite nennt Name und Alter und passt ins Suchergebnis', () => {
    expect(HOME_TITLE).toContain(SITE.title);
    expect(HOME_TITLE).toContain('ab 3');
    expect(HOME_TITLE.length).toBeLessThanOrEqual(60);
  });

  it('strukturierte Daten beschreiben Website und Spiel, kostenlos, ab 3, auf dieser Domain oder beim Spiel', () => {
    const ld = homeLd('Beschreibung');
    const [site, game] = ld['@graph'];
    expect(site?.['@type']).toBe('WebSite');
    expect(game).toMatchObject({
      '@type': 'VideoGame',
      description: 'Beschreibung',
      isAccessibleForFree: true,
      audience: { suggestedMinAge: 3 },
      offers: { price: 0 },
    });
    for (const url of JSON.stringify(ld).match(/https:\/\/[^"]+/g) ?? [])
      expect(url.startsWith(SITE.url) || [GAME_URL, 'https://schema.org', 'https://larmic.de/'].includes(url)).toBe(
        true,
      );
    expect(game).toMatchObject({ url: GAME_URL });
  });

  it('Farben stimmen mit den Design-Tokens überein', () => {
    const tokens = readFileSync('src/styles/tokens.css', 'utf8');
    expect(tokens).toContain(`--sky-1: ${SKY_1};`);
    expect(tokens).toContain(`--sky-2: ${SKY_2};`);
  });
});
