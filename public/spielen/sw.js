// Ablöse-Service-Worker – bleibt für immer hier liegen, nie löschen.
//
// Bis zum Umzug lief das Spiel unter www.mitwachsen-spiele.de/spielen/ mit einem eigenen Service Worker (dieselbe
// Adresse, Scope /spielen/, Seiten aus dem Cache). Geräte, die das Spiel damals geöffnet oder als App installiert haben,
// bekämen sonst weiter den alten Stand aus dem Cache und sähen die Weiterleitung auf weltenbummler.mitwachsen-spiele.de
// nie. Prüft der Browser den alten Worker auf ein Update, findet er diesen: Er übernimmt sofort, löscht die Caches,
// meldet sich ab und lädt offene Fenster neu. Dann kommt /spielen/ frisch vom Server, und das ist die Weiterleitung.
// Keine Seite dieser Website meldet ihn an. Test: e2e/retire.spec.ts
self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      await Promise.all(windows.map((client) => client.navigate(client.url)));
    })(),
  );
});
