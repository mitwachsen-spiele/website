import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { HOME_TITLE, SITE, SKY_1, SKY_2, gameLd, gamePage, homeLd, ldJson, type GameInfo } from './site';

const GAME: GameInfo = {
  slug: 'weltenbummler',
  name: 'Weltenbummler',
  url: 'https://weltenbummler.mitwachsen-spiele.de/',
  description: 'Beschreibung',
  genre: ['Kinderspiel'],
  minAge: 3,
  image: `${SITE.url}/_astro/bild.webp`,
};

/** Adressen in den Daten, die weder auf dieser Domain noch bei erlaubten Stellen liegen */
const foreignUrls = (ld: unknown, allowed: string[]) =>
  (JSON.stringify(ld).match(/https:\/\/[^"]+/g) ?? []).filter(
    (url) => !url.startsWith(SITE.url) && ![...allowed, 'https://schema.org', 'https://larmic.de/'].includes(url),
  );

describe('Daten für Suchmaschinen', () => {
  it('Titel der Startseite nennt Name und Alter und passt ins Suchergebnis', () => {
    expect(HOME_TITLE).toContain(SITE.title);
    expect(HOME_TITLE).toContain('ab 3');
    expect(HOME_TITLE.length).toBeLessThanOrEqual(60);
  });

  it('Detailseite eines Spiels liegt unter seinem Namen', () => {
    expect(gamePage('kistenschieber')).toBe('https://www.mitwachsen-spiele.de/kistenschieber/');
  });

  it('Startseite: Website und Liste der Spiele in ihrer Reihenfolge, je mit Verweis auf die Detailseite', () => {
    const ld = homeLd([
      { slug: 'weltenbummler', name: 'Weltenbummler' },
      { slug: 'kistenschieber', name: 'Kistenschieber' },
    ]);
    const [site, list] = ld['@graph'];
    expect(site).toMatchObject({ '@type': 'WebSite', url: `${SITE.url}/` });
    expect(list).toMatchObject({
      '@type': 'ItemList',
      itemListElement: [
        {
          position: 1,
          name: 'Weltenbummler',
          url: gamePage('weltenbummler'),
          item: { '@id': `${gamePage('weltenbummler')}#spiel` },
        },
        { position: 2, name: 'Kistenschieber', url: gamePage('kistenschieber') },
      ],
    });
    expect(foreignUrls(ld, [])).toEqual([]);
  });

  it('Detailseite: das Spiel, kostenlos, mit Mindestalter, Adresse des Spiels und Verweis auf die Seite', () => {
    const ld = gameLd(GAME);
    expect(ld).toMatchObject({
      '@type': 'VideoGame',
      '@id': `${gamePage('weltenbummler')}#spiel`,
      name: 'Weltenbummler',
      url: GAME.url,
      mainEntityOfPage: gamePage('weltenbummler'),
      description: 'Beschreibung',
      isAccessibleForFree: true,
      typicalAgeRange: '3-',
      audience: { suggestedMinAge: 3 },
      offers: { price: 0 },
    });
    expect(foreignUrls(ld, [GAME.url])).toEqual([]);
  });

  it('JSON-LD kann das Skript nicht beenden', () => {
    expect(ldJson({ a: '</script><b>' })).not.toContain('<');
  });

  it('Farben stimmen mit den Design-Tokens überein', () => {
    const tokens = readFileSync('src/styles/tokens.css', 'utf8');
    expect(tokens).toContain(`--sky-1: ${SKY_1};`);
    expect(tokens).toContain(`--sky-2: ${SKY_2};`);
  });
});
