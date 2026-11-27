// Würfel-Symbole und Texturen für die Seiten, beim Build erzeugt. BaseLayout gibt die Symbole einmal aus,
// danach zeichnet <use href="#v-…"> sie überall. Texturen landen als CSS-Variablen in :root.
import { cube, tileDataUri } from './render';
import * as T from './textures';
import { CUBE_H, CUBE_W, pos } from './cube';

export function cubeDefs(prefix = 'v'): string {
  const id = (n: string) => `${prefix}-${n}`;
  return [
    cube(id('grass'), T.GRASS_TOP, T.GRASS_SIDE, T.GRASS_SIDE, T.PAL_GRASS),
    cube(id('dirt'), T.DIRT, T.DIRT, T.DIRT, T.PAL_GRASS),
    cube(id('stone'), T.STONE, T.STONE, T.STONE, T.PAL_STONE),
    cube(id('log'), T.LOG_TOP, T.LOG_SIDE, T.LOG_SIDE, T.PAL_LOG),
    cube(id('leaves'), T.LEAVES, T.LEAVES, T.LEAVES, T.PAL_LEAVES),
    cube(id('plank'), T.PLANKS, T.PLANKS, T.PLANKS, T.PAL_BOARD),
    cube(id('pilz'), T.PILZ_T, T.PILZ_S, T.PILZ_S, T.PAL_PILZ),
  ].join('');
}

export function textureCss(): string {
  return `:root { --tex-grass: ${tileDataUri(T.GRASS_SIDE, T.PAL_GRASS)}; --tex-dirt: ${tileDataUri(T.DIRT, T.PAL_GRASS)}; --tex-stone: ${tileDataUri(T.STONE, T.PAL_STONE)}; }`;
}

/** Ein Block der kleinen Szene: Lage im Raster (i, j, Ebene k) und Symbol. */
export type Block = { i: number; j: number; k: number; sym: string };

/** Schwebende Insel für die Startseite und das Vorschaubild: Wiese auf Erde und Stein, hinten der Baum, vorn der Pilz. */
export const ISLAND: Block[] = [
  ...[0, 1, 2, 3].flatMap((i) => [0, 1, 2].map((j) => ({ i, j, k: 0, sym: 'grass' }))),
  ...[0, 1, 2, 3].flatMap((i) => [0, 1, 2].map((j) => ({ i, j, k: -1, sym: 'dirt' }))),
  ...[1, 2].flatMap((i) => [1, 2].map((j) => ({ i, j, k: -2, sym: 'stone' }))),
  { i: 2, j: 2, k: -3, sym: 'stone' },
  { i: 0, j: 0, k: 1, sym: 'log' },
  { i: 0, j: 0, k: 2, sym: 'log' },
  ...[0, 1].flatMap((i) => [0, 1].map((j) => ({ i, j, k: 3, sym: 'leaves' }))),
  { i: 0, j: 0, k: 4, sym: 'leaves' },
  { i: 3, j: 1, k: 1, sym: 'pilz' },
  { i: 2, j: 2, k: 1, sym: 'plank' },
];

/** Säule aus `height` Blöcken: Erde, oben Gras – zeigt, wie das Spiel mit dem Kind wächst. */
export function tower(height: number): Block[] {
  return Array.from({ length: Math.max(1, height) }, (_, k) => ({
    i: 0,
    j: 0,
    k,
    sym: k === Math.max(1, height) - 1 ? 'grass' : 'dirt',
  }));
}

/** Blöcke als <use>-Elemente, von hinten nach vorn sortiert; dazu die viewBox, die alle umschließt. */
export function sceneSvg(blocks: Block[]): { viewBox: string; uses: string } {
  if (blocks.length === 0) return { viewBox: `0 0 ${CUBE_W} ${CUBE_H}`, uses: '' };
  const sorted = [...blocks].sort((a, b) => a.i + a.j + a.k - (b.i + b.j + b.k) || a.k - b.k || a.i - b.i);
  const placed = sorted.map((b) => ({ b, xy: pos(b.i, b.j, b.k) }));
  const xs = placed.map((p) => p.xy[0]);
  const ys = placed.map((p) => p.xy[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const w = Math.max(...xs) - x0 + CUBE_W;
  const h = Math.max(...ys) - y0 + CUBE_H;
  const uses = placed
    .map((p) => `<use href="#v-${p.b.sym}" x="${p.xy[0]}" y="${p.xy[1]}" width="${CUBE_W}" height="${CUBE_H}"/>`)
    .join('');
  return { viewBox: `${x0} ${y0} ${w} ${h}`, uses };
}
