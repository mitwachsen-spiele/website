// Texte der Detailseite /kistenschieber/, alle an einer Stelle.
//
// Was sie über das Spiel sagen, muss zum Spiel passen (Repo mitwachsen-spiele/kistenschieber: Lektionen, Menü und
// Ausblick auf die Level stehen dort in src/data/games/). Kopf, Adresse und Eckdaten kommen aus
// src/content/games/kistenschieber.md.
//
// Blöcke (`block`) sind die Würfel-Symbole aus src/lib/voxel/blocks.ts.

/** Abschnitt „Was ist Kistenschieber?“ */
export const ABOUT = {
  title: 'Was ist Kistenschieber?',
  paragraphs: [
    'Kistenschieber ist ein ruhiges Denkspiel im Browser, für größere Kinder etwa ab 8 Jahren und für Erwachsene. Es läuft am Computer, auf dem Tablet und auf dem Handy, als App auch ohne Internet.',
    'Frauke kann eine Kiste nur schieben, nicht ziehen. Steht eine Kiste erst in der Ecke, kommt sie dort nicht mehr weg; also lohnt es sich, vorher zu überlegen. Eine Einführung in 15 Lektionen zeigt Schritt für Schritt, worauf es ankommt.',
    'Es gibt keine Uhr, keine Leben und keine Punkte. Gezählt werden nur die Züge, und wer mag, sucht den kürzesten Weg.',
  ],
  // Bild: der Startbildschirm des Spiels (src/assets/games/kistenschieber.webp)
  shotAlt:
    'Der Startbildschirm von Kistenschieber: oben der Name, darunter der Hafenkai mit Kiste, gelbem Feld und Frauke, darunter die Karten Einführung (jetzt spielbar, 15 Lektionen, Knopf Spielen) und Level (kommen bald), unten die Knöpfe Lektion wählen und Einstellungen',
  shotCaption: 'Der Startbildschirm: Die Einführung ist spielbar, die Level kommen bald.',
  facts: [
    ['Kosten', 'kostenlos, ohne Werbung'],
    ['Spielstand', 'bleibt im eigenen Browser'],
    ['Ohne Internet', 'als App auf dem Home-Bildschirm'],
  ] as [string, string][],
};

/** Abschnitt „Hilfen beim Knobeln“: vier Karten, Namen wie im Spiel */
export const HELP = {
  title: 'Hilfen beim Knobeln',
  intro: 'Feststecken gehört dazu. Darum ist Hilfe immer nur einen Tipp entfernt:',
  steps: [
    { block: 'plank', title: 'Zug zurück', text: 'Nimmt den letzten Zug zurück, so oft du willst.' },
    { block: 'leaves', title: 'Tipp', text: 'Ein Pfeil zeigt, welche Kiste du in welche Richtung schieben kannst.' },
    { block: 'pilz', title: 'Lösung zeigen', text: 'Das Spiel macht es einmal vor, danach bist du dran.' },
    {
      block: 'stone',
      title: 'Überspringen',
      text: 'Zu knifflig? Die nächste Lektion wird trotzdem frei, zurückkommen geht jederzeit.',
    },
  ],
};

/** Abschnitt „Was schon geht“: Stand wie im Spiel (Einführung spielbar, Level 1 bis 6 als Adventskalender) */
export const PROGRESS = {
  title: 'Was schon geht',
  intro:
    'Kistenschieber ist noch jung. Spielbar ist die Einführung, dazu die ersten sechs Level als Adventskalender: vom 1. bis 6. Dezember geht jeden Tag eins auf.',
  list: [
    { name: 'Einführung', text: '15 Lektionen, von einer Kiste bis zu kleinen Rätseln', done: true },
    { name: 'Kapitel 1: Am Kai', text: 'Level 1 bis 6, 2 bis 3 Kisten, ab 1. Dezember täglich eins', done: true },
    { name: 'Kapitel 1: Am Kai', text: 'Level 7 bis 12, mit Schranke und Schalter', done: false },
    { name: 'Kapitel 2: Im Speicher', text: 'Level 13 bis 24, 3 bis 4 Kisten', done: false },
  ],
  done: 'spielbar',
  soon: 'kommt bald',
};

/** Schluss mit zweitem „Spiel starten“ */
export const CLOSING = {
  title: 'Lust auf eine Runde?',
  text: 'Am Computer, auf dem Tablet oder auf dem Handy, ganz in Ruhe.',
};
