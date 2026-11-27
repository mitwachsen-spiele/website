// Zentrale Seitendaten.

/** Farben wie in src/styles/tokens.css (--sky-1, --sky-2); ein Test prüft, dass sie übereinstimmen */
export const SKY_1 = '#79c7ea';
export const SKY_2 = '#8dd0ee';

export const SITE = {
  title: 'Mitwachsen-Spiele',
  description:
    'Mitwachsen-Spiele: ruhige Spiele im Browser. Weltenbummler für Kinder ab 3 zusammen mit Mama oder Papa, Kistenschieber als Denkspiel für größere Kinder und Erwachsene. Kostenlos, ohne Werbung.',
  url: 'https://www.mitwachsen-spiele.de',
};

/** Titel der Startseite, auch für Suchmaschinen: Name, Alter, wo es läuft */
export const HOME_TITLE = 'Mitwachsen-Spiele – ruhige Kinderspiele ab 3 im Browser';

/** Was die strukturierten Daten über ein Spiel wissen müssen (aus src/content/games/<slug>.md) */
export type GameInfo = {
  slug: string; // Dateiname, zugleich Adresse der Detailseite
  name: string;
  url: string; // Adresse des Spiels
  description: string;
  genre: string[];
  minAge: number;
  image: string; // Bild aus dem Spiel, absolute Adresse auf dieser Domain
};

/** Adresse der Detailseite eines Spiels */
export const gamePage = (slug: string) => `${SITE.url}/${slug}/`;
const gameId = (slug: string) => `${gamePage(slug)}#spiel`;
const AUTHOR = { '@type': 'Person', name: 'Lars Michaelis', url: 'https://larmic.de/' };

/**
 * Strukturierte Daten der Startseite (schema.org, JSON-LD): die Website und die Liste der Spiele, jedes mit Verweis
 * auf seine Detailseite. Nur Angaben, die stimmen und auf der Seite stehen; der Autor ist derselbe wie im Impressum
 * auf larmic.de.
 */
export function homeLd(games: Pick<GameInfo, 'slug' | 'name'>[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        name: SITE.title,
        url: `${SITE.url}/`,
        inLanguage: 'de',
        author: AUTHOR,
      },
      {
        '@type': 'ItemList',
        '@id': `${SITE.url}/#spiele`,
        name: 'Spiele',
        itemListElement: games.map((g, n) => ({
          '@type': 'ListItem',
          position: n + 1,
          name: g.name,
          url: gamePage(g.slug),
          item: { '@id': gameId(g.slug) },
        })),
      },
    ],
  };
}

/** Strukturierte Daten einer Detailseite: das Spiel, kostenlos, mit Mindestalter und seiner eigenen Adresse */
export function gameLd(g: GameInfo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    '@id': gameId(g.slug),
    name: g.name,
    url: g.url,
    mainEntityOfPage: gamePage(g.slug),
    description: g.description,
    image: g.image,
    inLanguage: 'de',
    genre: g.genre,
    playMode: 'SinglePlayer',
    gamePlatform: 'Webbrowser',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Jedes Gerät mit aktuellem Browser',
    typicalAgeRange: `${g.minAge}-`,
    audience: { '@type': 'PeopleAudience', suggestedMinAge: g.minAge },
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'EUR' },
    isPartOf: { '@id': `${SITE.url}/#website` },
    author: AUTHOR,
  };
}

/** JSON-LD sicher in ein <script> schreiben: „<“ maskieren, damit kein Text das Skript beendet */
export const ldJson = (data: unknown) => JSON.stringify(data).replaceAll('<', '\\u003c');
