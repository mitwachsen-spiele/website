// Inhalts-Sammlungen mit Schema: Fehlt ein Pflichtfeld, bricht der Build ab (Guard-Gate für Inhalte).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
// Spiele: Eckdaten für die Startseite (nur Frontmatter, der Rumpf wird nicht gezeigt); die Texte der Startseite
// stehen in src/data/landing.ts, das Spiel selbst liegt auf https://weltenbummler.mitwachsen-spiele.de/
const games = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/games' }),
  schema: z.object({
    title: z.string(),
    teaser: z.string(), // Beschreibung der Startseite für Suchmaschinen
    age: z.string(), // ab welchem Alter, z. B. „ab 3 Jahren“
    together: z.string(), // wer mitspielt
    controls: z.string(),
    device: z.string(),
  }),
});

export const collections = { games };
