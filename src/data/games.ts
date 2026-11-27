// Lädt die Spiele aus src/content/games/ in der Reihenfolge der Startseite.
import { getCollection, getEntry } from 'astro:content';

export async function loadGames() {
  return (await getCollection('games')).sort((a, b) => a.data.order - b.data.order);
}

/** Ein Spiel nach seinem Namen (= Adresse der Detailseite); fehlt die Datei, bricht der Build ab */
export async function loadGame(slug: string) {
  const g = await getEntry('games', slug);
  if (!g) throw new Error(`Inhalt src/content/games/${slug}.md fehlt`);
  return g;
}
