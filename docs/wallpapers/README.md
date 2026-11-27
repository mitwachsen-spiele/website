# Hintergrundbilder

Quellen der Hintergrundbilder in `src/assets/wallpapers/` und des Banners im Profil der Organisation (Repo `mitwachsen-spiele/.github`, `profile/banner.png`). Erzeugt im November 2026 mit Canvas in Chromium (Playwright) und sharp aus den `node_modules` dieser Seite. Die Skripte sind Dokumentation, kein Teil des Builds; Pfade darin zeigen auf den Arbeitsordner von damals und müssen beim erneuten Erzeugen angepasst werden.

- `weltenbummler/`: legt ein neues Schild („Weltenbummler“, Adresse) auf das Original `src/assets/wallpapers/mitwachsen-original.png`. `render.cjs` erwartet das Original als `orig.png` und die Schrift `pixelify-sans-latin-700-normal.woff2` (aus `@fontsource/pixelify-sans`) im selben Ordner; `node render.cjs new weltenbummler.png`. Texte, Größen und Maserung in `layout.cjs`, Lage des Bretts in `geom.cjs`.
- `kistenschieber/`: zeichnet das ganze Bild prozedural mit festem Seed (`kistenschieber.html`), `render.cjs` rendert es in 3840 × 2160. Farben und Texturen aus dem Repo `kistenschieber` (`src/data/games/kaje.ts`).
- `banner/`: `crops.cjs` schneidet je eine Hälfte aus beiden Bildern, `banner.cjs` setzt sie mit schräger Naht zusammen und legt das Schild „Mitwachsen-Spiele“ in die Mitte (3600 × 1200).
