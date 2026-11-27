import { describe, expect, it } from 'vitest';
import {
  check,
  dynamicImports,
  inlineScriptsOf,
  loaded,
  packs,
  scriptsOf,
  staticImports,
  type Rule,
  type Usage,
} from './bundles.ts';

const files: Record<string, string> = {
  '/_astro/home.js': 'import{a as b}from"./shared.js";console.log(b)',
  '/_astro/shared.js': 'export const a=1;',
  '/_astro/game.js': 'import"./shared.js";const t=()=>import("./three.module.js");',
  '/_astro/three.module.js': 'class WebGLRenderer{}',
};
const read = (p: string) => files[p] ?? null;
const RULES: Rule[] = [
  { name: 'Startseite', pages: /^(?!spielen\/)/, budget: 100, forbidden: /game|WebGLRenderer/ },
  { name: 'Spiel', pages: /^spielen\//, budget: 1000, forbidden: /WebGLRenderer/ },
];
const page = (...srcs: string[]) => srcs.map((s) => `<script type="module" src="${s}"></script>`).join('');

describe('Bundle-Gate', () => {
  it('findet Skripte und Modulvorladungen im HTML', () => {
    const html = '<script type="module" src="/_astro/a.js"></script><link rel="modulepreload" href="/_astro/b.js">';
    expect(scriptsOf(html)).toEqual(['/_astro/a.js', '/_astro/b.js']);
  });

  it('folgt statischen Importen, aber nicht dynamischen', () => {
    expect(staticImports(files['/_astro/game.js']!)).toEqual(['./shared.js']);
    expect(loaded(page('/_astro/game.js'), read).sort()).toEqual(['/_astro/game.js', '/_astro/shared.js']);
  });

  it('lässt eine schlanke Startseite durch', () => {
    expect(check('index.html', page('/_astro/home.js'), read, RULES)).toEqual([]);
  });

  it('meldet Spielcode auf der Startseite', () => {
    const problems = check('index.html', page('/_astro/home.js', '/_astro/game.js'), read, RULES);
    expect(problems.some((p) => p.includes('/_astro/game.js'))).toBe(true);
  });

  it('meldet ein überschrittenes Budget', () => {
    const tight: Rule[] = [{ ...RULES[0]!, budget: 10 }];
    expect(check('index.html', page('/_astro/home.js'), read, tight)[0]).toMatch(/Bytes JavaScript/);
  });

  it('erlaubt dem Spiel Three.js nur als nachträglichen Import', () => {
    expect(check('spielen/index.html', page('/_astro/game.js'), read, RULES)).toEqual([]);
    const eager = check('spielen/index.html', page('/_astro/game.js', '/_astro/three.module.js'), read, RULES);
    expect(eager.length).toBeGreaterThan(0);
  });

  it('findet eingebettete Skripte, aber keine Dateien und keine Daten', () => {
    const html =
      '<script>a()</script><script type="module" src="/_astro/a.js"></script>' +
      '<script type="application/ld+json">{"game":1}</script><script type="module">\n  b()\n</script><script></script>';
    expect(inlineScriptsOf(html)).toEqual(['a()', '\n  b()\n']);
  });

  it('meldet Verbotenes in einem eingebetteten Skript', () => {
    const html = '<script>navigator.game.register("/x.js")</script>';
    const problems = check('index.html', html, read, RULES);
    expect(problems.some((p) => p.includes('eingebettetes Skript 1'))).toBe(true);
  });

  it('rechnet eingebettete Skripte ins Budget', () => {
    const none: Rule[] = [{ name: 'ohne JavaScript', pages: /^index\.html$/, budget: 0, forbidden: /game/ }];
    expect(check('index.html', '<script>x()</script>', read, none)[0]).toMatch(/3 Bytes JavaScript/);
    expect(check('index.html', '<p>ohne Skript</p>', read, none)).toEqual([]);
  });

  it('meldet fehlende Dateien', () => {
    expect(check('index.html', page('/_astro/weg.js'), read, RULES)[0]).toMatch(/fehlt/);
  });

  describe('nachgeladene Pakete', () => {
    const lazy: Record<string, string> = {
      '/_astro/core.js': 'import"./shared.js";const p=()=>import(`./welt-eis.1.js`),q=()=>import("./three.js");',
      '/_astro/shared.js': 'export const a=1;',
      '/_astro/welt-eis.1.js': 'import{a}from"./shared.js";import"./ice.js";export const pack=a;',
      '/_astro/ice.js': 'export const ice=12345;',
      '/_astro/three.js': 'class WebGLRenderer{}',
    };
    const readLazy = (p: string) => lazy[p] ?? null;
    const PACK: Rule = {
      name: 'Paket',
      pages: /^spielen\//,
      chunks: /\/welt-eis\.[\w-]+\.js$/,
      budget: 1000,
      forbidden: /WebGLRenderer/,
    };
    const html = page('/_astro/core.js');

    it('findet nachgeladene Importe, auch mit Backticks', () => {
      expect(dynamicImports(lazy['/_astro/core.js']!)).toEqual(['./welt-eis.1.js', './three.js']);
    });

    it('misst ein Paket samt seinen Importen, ohne was die Seite schon geladen hat', () => {
      expect(packs(html, readLazy, PACK.chunks!)).toEqual([
        { file: '/_astro/welt-eis.1.js', files: ['/_astro/welt-eis.1.js', '/_astro/ice.js'] },
      ]);
      const usage: Usage[] = [];
      expect(check('spielen/index.html', html, readLazy, [PACK], usage)).toEqual([]);
      const bytes = lazy['/_astro/welt-eis.1.js']!.length + lazy['/_astro/ice.js']!.length;
      expect(usage).toEqual([{ rule: 'Paket', page: 'spielen/index.html', file: '/_astro/welt-eis.1.js', bytes }]);
    });

    it('meldet ein zu großes Paket, Verbotenes darin und ein fehlendes Paket', () => {
      expect(check('spielen/index.html', html, readLazy, [{ ...PACK, budget: 10 }])[0]).toMatch(/lädt \d+ Bytes/);
      const heavy: Record<string, string> = { ...lazy, '/_astro/ice.js': 'import"./three.js";' };
      const problems = check('spielen/index.html', html, (p: string) => heavy[p] ?? null, [PACK]);
      expect(problems.some((p) => p.includes('/_astro/three.js'))).toBe(true);
      expect(check('spielen/index.html', page('/_astro/shared.js'), readLazy, [PACK])[0]).toMatch(/kein nachgeladenes/);
      const gone = (p: string) => (p === '/_astro/ice.js' ? null : readLazy(p));
      expect(check('spielen/index.html', html, gone, [PACK])[0]).toMatch(/fehlt/);
    });

    it('mit `after`: zählt nicht, was die Pakete davor schon mitbringen (Three.js der 3D-Ansicht, das Paket der Welt)', () => {
      const late: Record<string, string> = {
        ...lazy,
        '/_astro/core.js': 'import"./shared.js";import(`./view.1.js`);import("./welt-eis.1.js");',
        '/_astro/view.1.js': 'import"./three.js";export const v=1;',
        '/_astro/welt-eis.1.js': 'import"./ice.js";import("./welt-eis-3d.1.js");',
        '/_astro/welt-eis-3d.1.js': 'import"./three.js";import"./ice.js";import"./door.js";',
        '/_astro/door.js': 'export const door=1;',
      };
      const read = (p: string) => late[p] ?? null;
      const D3 = /\/welt-eis-3d\.[\w-]+\.js$/;
      expect(packs(html, read, D3)[0]!.files).toEqual([
        '/_astro/welt-eis-3d.1.js',
        '/_astro/three.js',
        '/_astro/ice.js',
        '/_astro/door.js',
      ]);
      expect(packs(html, read, D3, /\/(view|welt-eis)\.[\w-]+\.js$/)[0]!.files).toEqual([
        '/_astro/welt-eis-3d.1.js',
        '/_astro/door.js',
      ]);
      // Three.js kommt mit der Ansicht davor: Das Verbot gilt dann nur für das, was das Paket selbst mitbringt
      const rule: Rule = { ...PACK, chunks: D3, after: /\/(view|welt-eis)\.[\w-]+\.js$/ };
      expect(check('spielen/index.html', html, read, [rule])).toEqual([]);
      expect(check('spielen/index.html', html, read, [{ ...rule, after: undefined }])[0]).toMatch(/three\.js/);
      // ein Paket, das selbst zu `after` passt, zählt trotzdem sich selbst
      expect(packs(html, read, D3, /welt-eis/)[0]!.files).toEqual(['/_astro/welt-eis-3d.1.js']);
    });

    it('meldet ein Paket, das schon beim Laden kommt (Three.js nur per import())', () => {
      const THREE: Rule = { ...PACK, name: 'Three.js', chunks: /\/three\.js$/, forbidden: /Mitwachsen/ };
      expect(check('spielen/index.html', html, readLazy, [THREE])).toEqual([]);
      const eager: Record<string, string> = { ...lazy, '/_astro/shared.js': 'import"./three.js";export const a=1;' };
      expect(check('spielen/index.html', html, (p: string) => eager[p] ?? null, [THREE])).toEqual([
        'spielen/index.html: /_astro/three.js kommt schon beim Laden, nicht erst per import() („Three.js“)',
      ]);
    });

    describe('mit `parts`: mehrere Pakete unter einer Grenze', () => {
      const late: Record<string, string> = {
        ...lazy,
        '/_astro/core.js': 'import"./shared.js";import(`./view.1.js`);import("./welt-eis.1.js");',
        '/_astro/view.1.js': 'import"./three.js";import"./kit.js";export const v=1;',
        '/_astro/kit.js': 'export const kit=1;',
        '/_astro/welt-eis.1.js': 'import"./ice.js";import("./welt-eis-3d.1.js");',
        '/_astro/welt-eis-3d.1.js': 'import"./three.js";import"./kit.js";import"./ice.js";import"./door.js";',
        '/_astro/door.js': 'export const door=1;',
      };
      const read = (p: string) => late[p] ?? null;
      const WORLD: Rule = {
        name: 'Welt',
        pages: /^spielen\//,
        parts: [
          { chunks: /\/welt-eis\.[\w-]+\.js$/ },
          { chunks: /\/welt-eis-3d\.[\w-]+\.js$/, after: /\/(view|welt-eis)\.[\w-]+\.js$/ },
        ],
        budget: 1000,
        forbidden: /WebGLRenderer/,
      };
      const len = (...fs: string[]) => fs.reduce((n, f) => n + late[f]!.length, 0);

      it('misst alle Teile zusammen, jede Datei einmal, je Teil mit seinem `after`', () => {
        const usage: Usage[] = [];
        expect(check('spielen/index.html', html, read, [WORLD], usage)).toEqual([]);
        // ice.js holen beide Teile, gezählt wird es einmal; kit.js und Three.js bringt die Ansicht mit
        const bytes = len('/_astro/welt-eis.1.js', '/_astro/ice.js', '/_astro/welt-eis-3d.1.js', '/_astro/door.js');
        const file = '/_astro/welt-eis.1.js + /_astro/welt-eis-3d.1.js';
        expect(usage).toEqual([{ rule: 'Welt', page: 'spielen/index.html', file, bytes }]);
        expect(check('spielen/index.html', html, read, [{ ...WORLD, budget: bytes }])).toEqual([]);
        expect(check('spielen/index.html', html, read, [{ ...WORLD, budget: bytes - 1 }])).toEqual([
          `spielen/index.html: ${file} lädt ${bytes} Bytes JavaScript nach, erlaubt sind ${bytes - 1} („Welt“)`,
        ]);
      });

      it('meldet Verbotenes in einem Teil und jeden Teil ohne Paket', () => {
        const loose: Rule = { ...WORLD, parts: [WORLD.parts![0]!, { chunks: /\/welt-eis-3d\.[\w-]+\.js$/ }] };
        expect(check('spielen/index.html', html, read, [loose])[0]).toMatch(/three\.js enthält Verbotenes/);
        const missing: Rule = { ...WORLD, parts: [...WORLD.parts!, { chunks: /\/welt-wald\.[\w-]+\.js$/ }] };
        expect(check('spielen/index.html', html, read, [missing])).toEqual([
          `spielen/index.html: kein nachgeladenes Paket für „Welt“ (${String(/\/welt-wald\.[\w-]+\.js$/)})`,
        ]);
      });
    });

    it('zählt das Paket nicht in die Seite und gilt nur für ihre Seiten', () => {
      const core: Rule = { name: 'Kern', pages: /^spielen\//, budget: 1000, forbidden: /WebGLRenderer/ };
      const usage: Usage[] = [];
      check('spielen/index.html', html, readLazy, [core], usage);
      expect(usage[0]!.bytes).toBe(lazy['/_astro/core.js']!.length + lazy['/_astro/shared.js']!.length);
      expect(check('index.html', html, readLazy, [PACK])).toEqual([]);
    });
  });
});
