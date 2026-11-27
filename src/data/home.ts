// Texte der Startseite (/), der Spielauswahl, und was für alle Spiele gilt. Die Karten der Spiele kommen aus
// src/content/games/, die Abschnitte der Detailseiten aus src/data/<spiel>.ts.

/** Kopf der Startseite im Himmel */
export const HOME = {
  title: 'Mitwachsen-Spiele',
  subtitle: 'Ruhige Spiele im Browser, ohne Druck und ohne Punktejagd. Kostenlos, ohne Werbung und ohne Konto.',
  intro:
    'Manche spielt ihr zusammen, bei anderen knobelt man allein. Jedes Spiel sagt, für wen es gedacht ist: Sucht euch eins aus.',
  more: 'Mehr für Eltern',
  pick: 'Sucht euch ein Spiel aus',
  see: 'Ansehen',
  // Hinweis unter den Karten: kein Link, kein Versprechen auf ein Datum
  seed: 'Hier wächst ein neues Spiel.',
};

/** Steckbrief auf jeder Karte: dieselben Fragen in derselben Reihenfolge */
export const CARD_FACTS = { age: 'Alter', with: 'Mit wem', reading: 'Lesen', device: 'Gerät', status: 'Stand' };

/** Abschnitt „Für Eltern“ auf der Startseite (Anker #eltern, der alte Sprung der Startseite) */
export const PARENTS = {
  title: 'Für Eltern',
  text: 'Alle Spiele hier sind ruhig und ehrlich. Was ihr bei jedem davon erwarten könnt:',
  more: 'Mehr zu Weltenbummler für Eltern: Bildschirmzeit, zusammen spielen',
};

/** Versprechen für alle Spiele: Liste mit Häkchen, auf der Startseite und auf jeder Detailseite */
export const PROMISES = {
  title: 'Darauf könnt ihr euch verlassen',
  items: [
    'Keine Werbung und nichts zu kaufen',
    'Keine Anmeldung und kein Konto',
    'Kein Tracking und keine Cookies',
    'Keine Punkte, keine Tagesbelohnung, kein Zeitdruck',
    'Der Spielstand bleibt im eigenen Browser',
    'Kostenlos',
  ],
};

/** Kopf und Ende jeder Detailseite */
export const GAME_PAGE = {
  back: 'Alle Spiele',
  cta: 'Spiel starten',
  opens: 'öffnet', // „öffnet weltenbummler.mitwachsen-spiele.de“ unter dem Knopf
  others: 'Auch von uns',
};
