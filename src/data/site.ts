// Zentrale Seitendaten.

/** Farben wie in src/styles/tokens.css (--sky-1, --sky-2); ein Test prüft, dass sie übereinstimmen */
export const SKY_1 = '#79c7ea';
export const SKY_2 = '#8dd0ee';

/** Das Spiel liegt auf eigener Adresse (Repo mitwachsen-spiele/weltenbummler) */
export const GAME_URL = 'https://weltenbummler.mitwachsen-spiele.de/';
/** Name des Spiels */
export const GAME_NAME = 'Weltenbummler';
export const SITE = {
  title: 'Mitwachsen-Spiele',
  description:
    'Mitwachsen-Spiele: ruhige Spiele für Kinder ab 3 Jahren, gespielt zusammen mit Mama oder Papa. Das erste heißt Weltenbummler. Ohne Werbung, ohne Punkte, kostenlos im Browser.',
  url: 'https://www.mitwachsen-spiele.de',
};

/** Titel der Startseite, auch für Suchmaschinen: Name, Alter, wo es läuft */
export const HOME_TITLE = 'Mitwachsen-Spiele – Kinderspiele ab 3 Jahren im Browser';

/**
 * Strukturierte Daten der Startseite (schema.org, JSON-LD): die Website und das Spiel. Nur Angaben, die stimmen und
 * auf der Seite stehen; der Autor ist derselbe wie im Impressum auf larmic.de.
 */
export function homeLd(description: string) {
  const game = `${SITE.url}/#spiel`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        name: SITE.title,
        url: `${SITE.url}/`,
        inLanguage: 'de',
        about: { '@id': game },
      },
      {
        '@type': 'VideoGame',
        '@id': game,
        name: GAME_NAME,
        url: GAME_URL,
        description,
        image: `${SITE.url}/og.png`,
        inLanguage: 'de',
        genre: ['Kinderspiel', 'Entdecken'],
        playMode: 'SinglePlayer',
        gamePlatform: 'Webbrowser',
        applicationCategory: 'GameApplication',
        operatingSystem: 'Jedes Gerät mit aktuellem Browser',
        typicalAgeRange: '3-',
        audience: { '@type': 'PeopleAudience', suggestedMinAge: 3 },
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: 0, priceCurrency: 'EUR' },
        author: { '@type': 'Person', name: 'Lars Michaelis', url: 'https://larmic.de/' },
      },
    ],
  };
}
