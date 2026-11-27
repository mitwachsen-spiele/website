// Inhalts-Sammlungen mit Schema: Fehlt ein Pflichtfeld, bricht der Build ab (Guard-Gate für Inhalte).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
// Spiele: je Spiel eine Datei; ihr Name ist die Adresse der Detailseite (/<name>/) und gilt für immer. Die Daten füllen
// die Karte auf der Startseite (Bild, Symbol, Satz, Steckbrief), den Kopf der Detailseite und die strukturierten
// Daten. Nur Frontmatter, der Rumpf wird nicht gezeigt; die Abschnitte der Detailseiten stehen in src/data/<name>.ts.
// Das Spiel selbst liegt auf seiner eigenen Adresse (`url`).
const games = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/games' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        pageTitle: z.string(), // Titel der Detailseite im Browser-Tab, ohne „– Mitwachsen-Spiele“
        teaser: z.string(), // Beschreibung der Detailseite für Suchmaschinen
        lead: z.string(), // ein Satz auf der Karte der Startseite
        intro: z.string(), // Satz im Kopf der Detailseite
        url: z.string().startsWith('https://').endsWith('/'), // Adresse des Spiels, Ziel von „Spiel starten“
        order: z.number().int(), // Reihenfolge auf der Startseite
        theme: z.enum(['wiese', 'hafen']), // Bildwelt der Detailseite
        genre: z.array(z.string()).min(1),
        // Steckbrief: auf jeder Karte dieselben Fragen in derselben Reihenfolge
        age: z.string(), // ab welchem Alter, z. B. „ab 3 Jahren“
        ageShort: z.string(), // Marke auf dem Bild, z. B. „ab 3“
        minAge: z.number().int().min(0), // für Suchmaschinen
        with: z.string(), // mit wem, kurz: „zusammen mit dir“
        together: z.string(), // wer mitspielt, ausführlich für die Eckdaten der Detailseite
        reading: z.string(), // muss man lesen können?
        controls: z.string(),
        device: z.string(),
        // Stand als Marken: done = schon spielbar (Haken), sonst „kommt bald“ (gestrichelt), nie nur Farbe
        status: z.array(z.object({ text: z.string(), done: z.boolean() })).min(1),
        image: image(), // Hintergrundbild des Spiels (src/assets/wallpapers/, 3840 × 2160, 16:9): Karte und Kopf der Detailseite
        imageAlt: z.string(),
        icon: image(), // App-Symbol, wie auf dem Home-Bildschirm
      })
      .strict(),
});

export const collections = { games };
