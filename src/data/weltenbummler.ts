// Texte der Detailseite /weltenbummler/ (bis November 2026 die Startseite), alle an einer Stelle.
//
// Die Texte richten sich an Eltern und nennen, wonach sie suchen (Spiel für Kinder ab 3, im Browser, kostenlos, ohne
// Werbung). Was sie über das Spiel sagen, muss zum Spiel passen (Repo mitwachsen-spiele/weltenbummler); Zeiten und
// Empfehlungen wie im Hinweis für Eltern im Spiel. Kopf, Adresse und Eckdaten (Alter, Steuerung, …) kommen aus
// src/content/games/weltenbummler.md.
//
// Blöcke (`block`) sind die Würfel-Symbole aus src/lib/voxel/blocks.ts: grass, dirt, stone, log, leaves, plank, pilz.

/** Abschnitt „Was ist Weltenbummler?“ */
export const ABOUT = {
  title: 'Was ist Weltenbummler?',
  paragraphs: [
    'Weltenbummler ist ein Spiel für Kinder ab 3 Jahren, das im Browser läuft, am Computer und auf dem Tablet. Lesen muss dein Kind nicht: Gesteuert wird nur mit den Pfeiltasten oder dem Steuerkreuz, und alles Wichtige zeigt das Bild.',
    'Auf der Lichtung warten zwölf Tierarten darauf, gefunden zu werden: Hase, Igel, Schaf, Fuchs, Bär und andere. Läuft die Figur zu einem Tier hin, kommt es mit. Beeren und Wasser bringt sie zu den Trögen am Bett, und Klangsteine spielen zu jedem Ort eine kleine Melodie. Es gibt keine Punkte, keinen Zeitdruck und nichts, was man falsch machen kann.',
    'Gebaut hat es ein Vater für seinen Sohn: einfach, langsam und so, dass man gut wieder aufhören kann.',
  ],
  // Bildunterschrift zum Bild der Lichtung (src/assets/games/weltenbummler.webp)
  shotAlt:
    'Die Lichtung im Spiel: in der Mitte die Figur, dahinter Klangstein und Bett, rundherum Kuh, Igel, Biene, Schildkröte, Ente, Zicklein, Fuchs, Frosch und Hase auf der Wiese, links ein Futtertrog, rechts ein Wassertrog, unten links eine leuchtende Portal-Plattform mit Fliegenpilz-Bild, oben links eine graue, noch schlafende Plattform',
  shotCaption:
    'Die Lichtung mit dem Bett: Hier wohnen die Tiere, die dein Kind schon nach Hause gebracht hat. Ringsum bringen Portal-Plattformen die Figur zu den großen Toren.',
  // Eckdaten zusätzlich zu denen aus src/content/games/weltenbummler.md
  facts: [
    ['Kosten', 'kostenlos, ohne Werbung'],
    ['Spielstand', 'bleibt im eigenen Browser'],
    ['Ohne Internet', 'als App auf dem Home-Bildschirm'],
  ] as [string, string][],
};

/** Abschnitt „So spielt ihr zusammen“: drei Karten */
export const TOGETHER = {
  title: 'So spielt ihr zusammen',
  steps: [
    {
      block: 'grass',
      title: 'Das Kind steuert',
      text: 'Mit den Pfeiltasten oder dem Steuerkreuz auf dem Tablet. Alles geht durch Hinlaufen, eine Aktionstaste gibt es nicht.',
    },
    {
      block: 'plank',
      title: 'Du sitzt daneben',
      text: 'Du erzählst, benennst die Tiere und redest mit deinem Kind über das, was ihr gerade seht.',
    },
    {
      block: 'pilz',
      title: 'Am Ende ins Bett',
      text: 'Läuft die Figur ins Bett, wird es Nacht, eine leise Melodie spielt, und für heute ist Schluss. Gespeichert wird von allein.',
    },
  ],
};

/** Abschnitt „Wächst mit“: eine Säule je Altersstufe, jedes Jahr ein Block höher */
export const STAGES = {
  title: 'Wächst mit eurem Kind',
  intro:
    'Jedes Jahr kommt etwas dazu, das zum Alter passt. Hinter acht großen Toren warten weitere Welten, von der Eiswelt bis zum Pilzwald. Die Lichtung mit allen gefundenen Tieren bleibt dabei dieselbe.',
  list: [
    { age: 'ab 3 Jahren', status: 'spielbar', text: 'Laufen, die Lichtung erkunden, Tiere finden, schlafen gehen.' },
    { age: 'ab 4 Jahren', status: 'geplant', text: 'Blöcke bauen und abbauen, Vorlagen nachbauen.' },
    { age: 'ab 5 Jahren', status: 'geplant', text: 'Kleine Aufgaben und Zählen.' },
  ],
};

/** Abschnitt Bildschirmzeit */
export const SCREEN_TIME = {
  title: 'Bildschirmzeit mit Maß',
  intro:
    'Die Leitlinie der deutschen Kinder- und Jugendmedizin rät für 3- bis 6-Jährige zu höchstens 30 Minuten an einzelnen Tagen, mit einem Elternteil dabei. Weltenbummler hilft dabei, ohne etwas abzubrechen.',
  marks: [
    { time: '15 Min.', text: 'Die Figur setzt sich hin und gähnt.' },
    { time: '20 Min.', text: 'Sie gähnt noch einmal.' },
    { time: '25 Min.', text: 'Sie möchte ins Bett.' },
  ],
  note: 'Wann Schluss ist, entscheidest du. Beim ersten Start zeigt das Spiel einen kurzen Hinweis für Eltern mit den Empfehlungen und Quellen.',
};

/** Schluss mit zweitem „Spiel starten“ */
export const CLOSING = {
  title: 'Lust auf eine Runde?',
  text: 'Am besten am Computer oder Tablet, mit deinem Kind auf dem Schoß.',
};
