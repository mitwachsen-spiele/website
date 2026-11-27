# mitwachsen-spiele.de

Die Homepage von https://www.mitwachsen-spiele.de/: ruhige Spiele für Kinder ab 3 Jahren, die man zusammen mit Mama oder Papa spielt. Ohne Werbung, ohne Punkte, kostenlos im Browser. Gebaut mit [Astro](https://astro.build), ausgeliefert als statische Seite über GitHub Pages.

Die Spiele haben eigene Repos und Adressen: [Weltenbummler](https://github.com/mitwachsen-spiele/weltenbummler) läuft unter https://weltenbummler.mitwachsen-spiele.de/. Bis Ende November 2026 lag alles in [larmic/mitwachsen-spiele](https://github.com/larmic/mitwachsen-spiele); der Umzug steht in larmic/mitwachsen-spiele#71.

## Schnellstart

Voraussetzung ist Node.js in der Version aus `.nvmrc`, zum Beispiel über Homebrew:

```bash
brew install node
npm install
npm run dev
```

Die Seite läuft dann unter http://localhost:4321 und lädt Änderungen sofort neu.

| Befehl | Wirkung |
| --- | --- |
| `npm run dev` | Entwicklungsserver mit Live-Reload |
| `npm run check` | Prüft Typen und Inhalts-Schemas. Guard-Gate |
| `npm test` | Unit-Tests (Vitest) für Würfel-Grafik, Seitendaten und die Gates, mit Mindest-Abdeckung (`vitest.config.ts`). Guard-Gate |
| `npm run lint` | ESLint für TypeScript und Astro. Guard-Gate |
| `npm run format` / `format:check` | Prettier formatiert bzw. prüft den Code. `format:check` ist Guard-Gate |
| `npm run arch` | Architekturregeln (dependency-cruiser): Schichten `lib` → `data` → Oberfläche. Guard-Gate |
| `npm run build` | Erzeugt die fertige Seite in `dist/` |
| `npm run verify` | Prüft die fertige Seite: gültiges HTML, keine toten internen Links und Sprungmarken, Bundle-Gate (Startseite ohne JavaScript, keine Seite mit Spielcode, je höchstens 32 KB), Seiten-Gate (keine externen Ressourcen ohne Klick, alte Adressen leiten weiter). Guard-Gate nach dem Build |
| `npm run test:e2e` | Browser-Tests (Playwright, `e2e/`): Seiten ohne Fehler in der Konsole, Weg ins Spiel, 320 px ohne seitliches Scrollen, Weiterleitung von `/spielen/`, Ablöse-Service-Worker, Barrierefreiheit nach WCAG 2.2 AA (axe-core). Einmalig `npx playwright install chromium` |
| `npm run gates:ci` | Alle Gates CI-nah in Docker (2 CPUs), Pflicht vor jedem Push (`.githooks/pre-push`) |

## Alte Adressen

Bis zum Umzug lag das Spiel unter `/spielen/`. Die Adresse leitet für immer auf https://weltenbummler.mitwachsen-spiele.de/ weiter (`redirects` in `astro.config.mjs`, geprüft über `LEGACY` in `scripts/verify-dist.ts`). Dazu liegt unter `/spielen/sw.js` für immer ein Ablöse-Service-Worker (`public/spielen/sw.js`): Geräte, die das Spiel noch mit dem alten Service Worker aus dem Cache laden, bekommen ihn beim nächsten Update-Check. Er löscht die Caches, meldet sich ab und lädt neu, dann greift die Weiterleitung.

## Pipeline und Deploy

`.github/workflows/deploy.yml` läuft bei jedem Pull Request und jedem Push auf `main`: `static` (Format, Lint, Architektur, Typen), `coverage`, `build` (mit `verify`), `e2e-site` (Browser-Tests auf genau diesem Build). Der Job `Guard-Gates` fasst sie zusammen und ist der einzige Pflicht-Check im Ruleset `protect main`. Nur auf `main` und nur nach `Guard-Gates` veröffentlicht `deploy` auf GitHub Pages, ohne Schreibrechte aufs Repo. Für den Notfall startet `fast-deploy.yml` von Hand ohne Gates.

### Einmalig einrichten

1. **DNS** bei OVH für `mitwachsen-spiele.de`: `www` als `CNAME` auf `mitwachsen-spiele.github.io.`, die Domain ohne `www` mit `A`-Einträgen auf `185.199.108.153` bis `185.199.111.153` und `AAAA` auf `2606:50c0:8000::153` bis `2606:50c0:8003::153`. Erst die Domain in GitHub eintragen, dann DNS; beim Rückbau umgekehrt.
2. **Domain verifizieren** in der Organisation `mitwachsen-spiele` (Settings → Pages, TXT `_github-pages-challenge-mitwachsen-spiele`).
3. **GitHub Pages**: Quelle „GitHub Actions“, Custom domain `www.mitwachsen-spiele.de`, „Enforce HTTPS“. Die Domain ohne `www` leitet GitHub dann auf `www`.
4. **Renovate**: App in der Organisation, gemeinsame Regeln in [mitwachsen-spiele/renovate-config](https://github.com/mitwachsen-spiele/renovate-config).
5. **Ruleset `protect main`**: Löschen und Force-Push verboten, Pflicht-Check `Guard-Gates`.

## Datenschutz und Recht

- Impressum und Kontakt liegen auf larmic.de (`https://larmic.de/impressum/`); das Impressum dort gilt auch für mitwachsen-spiele.de samt Subdomains. Die Datenschutzerklärung ist eigen, unter `/datenschutz/`.
- Beim Laden der Seite wird nichts von Dritten nachgeladen: Schriften sind lokal gebündelt, keine Cookies, kein Tracking, kein JavaScript auf der Startseite.

## Design

Farben, Typografie und Bausteine stehen in [docs/design-system.md](docs/design-system.md). Die Design-Tokens liegen in `src/styles/tokens.css`.

## Lizenz

Der Quellcode steht unter der MIT-Lizenz. Texte, Bilder, Impressum und Datenschutzerklärung sind davon ausgenommen, hier sind alle Rechte vorbehalten. Details in [LICENSE](LICENSE).
