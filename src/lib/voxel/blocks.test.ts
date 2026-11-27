import { describe, expect, it } from 'vitest';
import { ISLAND, cubeDefs, sceneSvg, textureCss, tower } from './blocks';

describe('cubeDefs', () => {
  it('erzeugt je Block ein Symbol mit Präfix', () => {
    const defs = cubeDefs();
    for (const id of ['grass', 'dirt', 'stone', 'log', 'leaves', 'plank', 'pilz']) {
      expect(defs).toContain(`<symbol id="v-${id}"`);
    }
    expect(cubeDefs('x')).toContain('id="x-grass"');
  });
});

describe('textureCss', () => {
  it('setzt die drei Texturen als CSS-Variablen', () => {
    const css = textureCss();
    expect(css).toMatch(/--tex-grass: url\(/);
    expect(css).toMatch(/--tex-dirt: url\(/);
    expect(css).toMatch(/--tex-stone: url\(/);
  });
});

describe('sceneSvg', () => {
  it('zeichnet jeden Block genau einmal, von hinten nach vorn', () => {
    const { uses } = sceneSvg(ISLAND);
    expect(uses.match(/<use /g)).toHaveLength(ISLAND.length);
    // Der Pilz steht vorn auf der Insel und kommt nach dem Gras darunter
    expect(uses.indexOf('#v-pilz')).toBeGreaterThan(uses.lastIndexOf('#v-grass'));
  });
  it('umschließt alle Blöcke mit der viewBox', () => {
    const { viewBox } = sceneSvg([{ i: 0, j: 0, k: 0, sym: 'grass' }]);
    expect(viewBox).toBe('0 0 80 84.8');
  });
  it('liefert für eine leere Szene einen einzelnen Würfelrahmen', () => {
    expect(sceneSvg([])).toEqual({ viewBox: '0 0 80 84.8', uses: '' });
  });
});

describe('ISLAND', () => {
  it('hat jede Lage höchstens einmal belegt', () => {
    const keys = ISLAND.map((b) => `${b.i},${b.j},${b.k}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('nutzt nur Blöcke, die es als Symbol gibt', () => {
    const defs = cubeDefs();
    for (const b of ISLAND) expect(defs).toContain(`id="v-${b.sym}"`);
  });
});

describe('tower', () => {
  it('stapelt Erde und setzt oben Gras', () => {
    expect(tower(3).map((b) => b.sym)).toEqual(['dirt', 'dirt', 'grass']);
    expect(tower(3).map((b) => b.k)).toEqual([0, 1, 2]);
  });
  it('hat mindestens einen Block', () => {
    expect(tower(0)).toEqual([{ i: 0, j: 0, k: 0, sym: 'grass' }]);
  });
  it('wird mit jeder Ebene 44,8 höher', () => {
    const h = (n: number) => Number(sceneSvg(tower(n)).viewBox.split(' ')[3]);
    expect(h(2) - h(1)).toBeCloseTo(44.8);
  });
});
