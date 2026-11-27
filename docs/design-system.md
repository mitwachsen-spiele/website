# Designsystem

Die Seite ist eine kleine Voxel-Welt: Himmel oben, darunter Gras, Erde und Stein. Gold ist die einzige Farbe für Aktionen. Alle Werte stehen als CSS-Variablen in `src/styles/tokens.css`. Übernommen aus der „Inselwelt“ von larmic.de, ohne Insel und Figur.

Vorbild ist die Optik von Hytale und Minecraft. Alle Grafiken sind eigene Voxel-Zeichnungen, ohne Logos, Figuren oder Texturen aus den Spielen.

## Grundfarben

| Rolle | Token | Wert | Einsatz |
| --- | --- | --- | --- |
| Tinte | `--ink` | #1d2838 | Text, Überschriften, alle Pixel-Rahmen |
| Himmel | `--sky-1/2/3` | #79c7ea, #8dd0ee, #a6dbf2 | Kopf als gestufter Verlauf mit harten Kanten |
| Gold | `--gold`, `--gold-light`, `--gold-dark` | #f0a531, #ffd47e, #b46a0c | Buttons, Fokus im Spiel |
| Papier | `--paper` | #fffdf7 | Inhaltspanel |
| Grau | `--muted` | #4b5563 | Unterzeilen |
| Fehlerrot | `--error` | #a3221b | Welt löschen im Spielmenü |
| Holz | `--wood-bg`, `--wood-frame`, `--wood-dark` | #f3ead6, #b3a385, #6b5d43 | Schild „Sucht euch ein Spiel aus“, Marke „kommt bald“ (gestrichelt in `--wood-dark`), Leiste „Auch von uns“ |
| Grün | `--ok` | #2b7a42 | Haken in der Marke „spielbar“ |
| Wasser | `--water-1/2/3` | #a6dbf2, #8dd0ee, #64aedb | Thema Hafen: Kopf statt Himmel |
| Granit | `--granite`, `--granite-dark` | #a1a9b2, #59606a | Thema Hafen: Kaikante statt Gras |
| Klinker | `--klinker`, `--klinker-joint` | #a9583c, #6a3a28 | Thema Hafen: Boden statt Erde |
| Erde | `--tex-dirt` + `--dirt-shade` | Textur, 40 % #2b1a0f darüber | Hintergrund hinter dem Inhalt |
| Stein | `--tex-stone` + `--stone-shade` | Textur, 62 % #14161c darüber | Footer |

Die Farben der Spiele selbst stehen in ihren Repos. Die Hafenfarben sind die von Kistenschieber (Wasser wie sein App-Symbol, Kaikante, Klinker).

## Themen der Detailseiten

Jede Detailseite hat die Bildwelt ihres Spiels (`theme` in `src/content/games/<spiel>.md`), Aufbau, Schriften, Panels, Gold und Fuß bleiben gleich:

- **wiese** (Weltenbummler): Himmel, Gras, Erde wie die Startseite.
- **hafen** (Kistenschieber): Wasser in drei Stufen statt Himmel, Kaikante aus Granit statt Gras, Klinker statt Erde. Text steht immer dunkel auf hellem Grund.

## Typografie

| Schrift | Schnitte | Einsatz |
| --- | --- | --- |
| Pixelify Sans | 500, 700 | Logo, Überschriften, Buttons, Namen im Spiel |
| Nunito | 400, 600, 800 | Fließtext, 18–19 px, Zeilenhöhe 1,6–1,7 |

Beide Schriften sind über `@fontsource` lokal gebündelt.

## Bausteine

- **Pixel-Rahmen:** vier Box-Schatten in Tinte statt `border` (`--px-4`, `--px-3`). Dadurch fehlen die Eckpixel wie in einem Spiel-Interface. Große Flächen bekommen zusätzlich 12 px versetzten Schatten.
- **Goldener Button (`.pxbtn`):** innen oben helles, unten dunkles Kantenlicht, sinkt beim Klick 3 px ein. Gold heißt „Spiel starten“ und steht nur auf den Detailseiten; die Startseite hat kein Gold.
- **Heller Button (`.pxbtn.light`):** Papier statt Gold für Wege innerhalb der Seite, der Rückweg „Alle Spiele“.
- **Spielkarte (Startseite):** Papier mit Pixel-Rahmen; oben das Bild aus dem Spiel (16:10) mit App-Symbol und Altersmarke, darunter Name, ein Satz, der Steckbrief (Alter, Mit wem, Lesen, Gerät, Stand) und „Ansehen“. Die Zeilen der Karten liegen per `subgrid` auf gleicher Höhe. Der Name ist der einzige Link und spannt sich über die ganze Karte; Fokus ist der gestrichelte Rahmen um die Karte.
- **Marken für den Stand:** „spielbar“ himmelblau mit Pixel-Haken, „kommt bald“ Holz mit gestricheltem Rand. Nie nur Farbe, der Text sagt es.
- **Hinweis auf weitere Spiele:** flach, gestrichelt, weiße Schrift auf Erde, kein Link.
- **Sprechblase:** weiß, 3 px Pixel-Rahmen, eckiger Zipfel (im Spiel, wenn die Figur müde wird).

## Bewegung

Animationen nutzen meist `steps()` für den Pixel-Look. Auf den Seiten bewegen sich nur die Wolken, die Insel auf der Startseite (schwebt in vier Stufen auf und ab) und „Ansehen“ auf einer Karte unter der Maus (hebt sich 2 px). Bei `prefers-reduced-motion` sind alle Animationen aus, auch im Spiel.

## Icons

Seiten-Icon und App-Icon ist ein Grasblock aus der eigenen Würfel-Grafik (`src/lib/voxel/icon.ts`), beim Build gerendert: `favicon.svg` und `favicon.ico` transparent, `apple-touch-icon.png` (180 px) und die Icons der App (192 und 512 px) auf `--sky-2`. Die maskierbaren Icons (`icon-maskable-*.png`) tragen den Würfel auf 60 % der Kante, damit runde Masken nichts abschneiden. `theme-color` und Hintergrund der App sind `--sky-1`. Die Werte stehen in `src/data/pwa.ts`, ein Test hält sie gleich mit `tokens.css`.

## Voxel-Technik

Die Blöcke der Seiten entstehen beim Build als SVG (`src/lib/voxel/`).

- **Projektion:** dimetrisch 2:1. Block (i, j, k) liegt bei X = (i − j)·40, Y = (i + j)·20 − k·44,8. Ein Würfel ist ein `<symbol>` mit `viewBox="0 0 80 84.8"` (`blocks.ts`, `cube.ts`).
- **Texturen:** 8×8 Pixel pro Fläche, definiert als Textraster in `textures.ts`. Schattierung: oben 5 % weiß, links 8 % schwarz, rechts 26 % schwarz. Das Spiel nutzt dieselben Texturen in seiner Ansicht von vorn und in 3D.
- **Szenen:** `ISLAND` in `blocks.ts` ist die schwebende Insel mit Baum, Pilz und Brett: groß im Kopf der Startseite und im Vorschaubild (`og.png`). `tower(n)` stapelt n Blöcke (Erde, oben Gras) für die Altersstufen auf der Detailseite von Weltenbummler. `sceneSvg` sortiert die Blöcke von hinten nach vorn und berechnet die viewBox.
