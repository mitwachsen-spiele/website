# CLAUDE.md

Homepage von mitwachsen-spiele.de (www.mitwachsen-spiele.de) von Lars Michaelis, im Voxel-Stil. Astro 7, statische Ausgabe, Sprache Deutsch. Die Spiele haben eigene Repos in der Organisation `mitwachsen-spiele` und eigene Adressen: Weltenbummler unter https://weltenbummler.mitwachsen-spiele.de/ (Repo `weltenbummler`). Hier gibt es keinen Spielcode.

## Befehle

```bash
npm run dev      # Entwicklungsserver auf http://localhost:4321
npm run check    # Guard-Gate: Typen und Inhalts-Schemas
npm test         # Guard-Gate: Unit-Tests (Vitest) mit Mindest-Abdeckung (vitest.config.ts)
npm run lint     # Guard-Gate: ESLint
npm run format   # Prettier; `npm run format:check` ist das Guard-Gate
npm run arch     # Guard-Gate: Architekturregeln (dependency-cruiser)
npm run build    # statische Seite nach dist/
npm run verify   # Guard-Gate nach dem Build: gültiges HTML, keine toten internen Links, Bundle-Gate (Startseite ohne JavaScript, keine Seite mit Spielcode oder Service-Worker-Anmeldung, je ≤ 32 KB), Seiten-Gate (keine externen Ressourcen, alte Adressen leiten weiter)
npm run test:e2e # Guard-Gate nach dem Build: Browser-Tests (Playwright, e2e/), samt Ablöse-Service-Worker und Barrierefreiheit nach WCAG 2.2 AA
npm run gates    # alle Gates nacheinander, nativ
npm run gates:ci # alle Gates CI-nah in Docker (scripts/ci-local.sh), 2 CPUs; grün schreibt den Tree-Hash nach .ci-local-ok
# Git-Hook .githooks/pre-commit prüft vor jedem Commit Formatierung, Lint, Architektur, Tests
# Git-Hook .githooks/pre-push verlangt .ci-local-ok == Tree des gepushten Commits, sobald er mehr als Doku berührt
```

## Aufbau

- `src/pages/` – Startseite `/`, `/datenschutz/`, 404, `og.png`, Favicons und `apple-touch-icon`
- `src/data/` – `site.ts` (Seitendaten, Farben, Adresse des Spiels `GAME_URL`, strukturierte Daten), `landing.ts` (alle Texte der Startseite)
- `src/content/games/` – Eckdaten der Spiele (Markdown, Schema in `src/content.config.ts`)
- `src/lib/voxel/` – Würfel-Grafik, läuft beim Build: `textures.ts`, `blocks.ts`, `cube.ts`, `render.ts`, `icon.ts`
- `src/components/`, `src/layouts/` – Oberfläche
- `src/styles/` – `tokens.css` (Design-Tokens), `global.css`, `sections.css`, `landing.css`
- `public/spielen/sw.js` – Ablöse-Service-Worker der alten Spieladresse
- `scripts/` – Gates nach dem Build: `bundles.ts` (Bundle-Gate), `dist.ts` (Seiten-Gate, `REDIRECT_HOSTS`), `ci-local.sh`
- `docs/design-system.md` – Farben, Materialien, Typografie

## Regeln

- Design-Tokens aus `tokens.css` nutzen, keine neuen Farben ohne Grund. Gold ist die einzige Aktionsfarbe.
- Keine externen Ressourcen ohne Klick des Nutzers (Schriften lokal). Geprüft durch `npm run verify:dist` (Logik in `scripts/dist.ts`).
- Kein JavaScript auf der Startseite; alle Inhalte stehen im HTML. Animationen respektieren `prefers-reduced-motion`.
- Keine Logos, Figuren oder Texturen aus Minecraft oder Hytale – nur eigene Voxel-Grafik.
- Die Homepage ist keine App: kein Manifest, keine Anmeldung eines Service Workers. Das Spiel ist eine App auf seiner eigenen Adresse.
- `public/spielen/sw.js` ist dauerhaft der Ablöse-Worker für Geräte, die das Spiel noch unter `/spielen/` kennen: nie löschen, nie verschieben, keine Seite meldet ihn an. Test: `e2e/retire.spec.ts`.
- Alte Adressen gelten für immer: Ändert sich eine Adresse, leitet die alte weiter (`redirects` in `astro.config.mjs`) und kommt in `LEGACY` in `scripts/verify-dist.ts`. Fremde Ziele nur über `REDIRECT_HOSTS` in `scripts/dist.ts`. Heute: `/spielen/` → https://weltenbummler.mitwachsen-spiele.de/.
- Links zum Spiel gehen auf `GAME_URL` aus `src/data/site.ts`, nie auf einen Pfad dieser Seite.
- TypeScript prüft jeden Index-Zugriff (`noUncheckedIndexedAccess`): fehlende Einträge behandeln.
- Arbeitsweise mit Issues und Pull Requests: Was umgesetzt wird, steht als Issue im Repo (Entwürfe liegen im Artefakt, nicht im Repo). Jedes Feature und jeder Fehler bekommt einen eigenen Branch (`feat/<nr>-<kurz>`, `fix/<nr>-<kurz>`, nur Doku: `docs/<kurz>`); auf `main` wird nicht mehr direkt committet. Auf dem Branch entsteht das Feature in einzelnen Commits je Schritt wie bisher. Ist es fertig, wird der Branch gepusht und ein Pull Request mit `Closes #<nr>` in der Beschreibung angelegt. Das Gate bleibt der lokale CI-nahe Lauf (`npm run gates:ci`) vor dem Push, wie unten beschrieben; die Pipeline des Pull Requests ist die zweite Prüfung, sie ersetzt den lokalen Lauf nicht. Sind alle Gates der Pipeline grün, mergt Claude den Pull Request selbst (Merge-Commit, Branch danach löschen); erst das löst den Deploy aus. Ist ein Gate rot, wird nicht gemergt, sondern die Ursache auf dem Branch behoben. Aufgaben im Issue werden beim Erledigen abgehakt.
- CI-naher Lauf (`npm run gates:ci`): Bevor dem Nutzer ein Feature als fertig gemeldet wird und vor jedem Push eines Stapels muss er auf dem finalen HEAD grün sein, auch nach Merges (der Pre-Push-Hook prüft `.ci-local-ok`). Lokale Läufe auf vielen Kernen sagen nichts über den 4-vCPU-Runner mit Software-WebGL. Ein roter oder wackliger Lauf wird nie wegerklärt („Flake“, „lokal grün“), sondern die Ursache behoben. Zeitgrenzen (`expect`, Test, Job) nur mit Trace und Begründung in der Commit-Nachricht anheben.
