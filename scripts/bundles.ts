// Prüflogik für das Bundle-Gate (npm run verify:bundles) – rein, ohne Dateisystem, damit testbar.
// Ermittelt, welches JavaScript eine fertige Seite beim Laden holt: die Skripte im HTML (eingebettet und als Datei) und
// alles, was diese statisch importieren. Dynamische Importe (`import("…")`) zählen nicht, sie laden erst später und nur bei Bedarf.
// Nachgeladene Pakete (z. B. die Welt-Pakete des Spiels) misst eine Regel mit `chunks` für sich: das Paket samt seinen
// statischen Importen, abzüglich dessen, was die Seite beim Laden schon hat und, mit `after`, was die Pakete schon
// mitbringen, nach denen es erst kommt (der 3D-Teil einer Welt nach der 3D-Ansicht und dem Paket der Welt).
// Mit `parts` misst eine Regel mehrere nachgeladene Pakete zusammen (je mit eigenem `after`), mit einer Grenze für alle.
// Ein nachgeladenes Paket, das die Seite schon beim Laden holt, ist ein Verstoß: Es käme dann nicht erst per import().

export type Rule = {
  name: string;
  pages: RegExp; // für welche Seiten (Pfad relativ zu dist, z. B. "spielen/index.html")
  budget: number; // höchstens so viele Bytes JavaScript beim Laden (mit `chunks`: je nachgeladenem Paket)
  forbidden: RegExp; // darf im geladenen Code nicht vorkommen
  /** Statt der Seite: jedes nachgeladene Paket, dessen Pfad hierzu passt (z. B. /\/welt-eis\.[\w-]+\.js$/); es muss eins geben */
  chunks?: RegExp;
  /**
   * Nur mit `chunks`: Das Paket kommt erst nach diesen nachgeladenen Paketen (z. B. /\/mitwachsen-3d\.[\w-]+\.js$/);
   * was sie samt ihren statischen Importen mitbringen (etwa Three.js), ist dann schon da und zählt nicht
   */
  after?: RegExp;
  /** Statt `chunks`: mehrere Teile, zusammen gemessen (jede Datei einmal); jeder Teil muss ein Paket finden */
  parts?: Part[];
};

/** Teil einer Regel mit `parts`: nachgeladene Pakete wie bei `chunks`, mit eigenem `after` */
export type Part = { chunks: RegExp; after?: RegExp };

/** Größe je Regel und Seite bzw. Paket, für die Ausgabe des Gates */
export type Usage = { rule: string; page: string; file?: string; bytes: number };

/** Skripte, die eine Seite lädt: <script src> und <link rel="modulepreload"> */
export function scriptsOf(html: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+\.js)"/g)) out.add(m[1]!);
  for (const m of html.matchAll(/<link\b[^>]*\brel="modulepreload"[^>]*\bhref="([^"]+\.js)"/g)) out.add(m[1]!);
  return [...out];
}

/** Inhalt der eingebetteten Skripte (<script> ohne src); Daten wie JSON-LD sind kein JavaScript und fallen weg */
export function inlineScriptsOf(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] ?? '';
    if (/\bsrc\s*=/i.test(attrs)) continue;
    if (/\btype\s*=\s*["']?application\/(?:ld\+)?json/i.test(attrs)) continue;
    const body = m[2] ?? '';
    if (body.trim()) out.push(body);
  }
  return out;
}

/** Statische, relative Importe eines (auch minifizierten) Moduls; `import("…")` wird ausgelassen */
export function staticImports(code: string): string[] {
  const out = new Set<string>();
  for (const m of code.matchAll(/\bimport\s*(?:[\w$*{}\s,]+?\s*from\s*)?["'](\.{1,2}\/[^"']+\.js)["']/g))
    out.add(m[1]!);
  for (const m of code.matchAll(/\bexport\s*(?:\*|\{[^}]*\})\s*from\s*["'](\.{1,2}\/[^"']+\.js)["']/g)) out.add(m[1]!);
  return [...out];
}

/** Nachgeladene, relative Importe eines (auch minifizierten) Moduls: `import("…")`, auch mit Backticks */
export function dynamicImports(code: string): string[] {
  const out = new Set<string>();
  for (const m of code.matchAll(/\bimport\(\s*["'`](\.{1,2}\/[^"'`]+\.js)["'`]\s*\)/g)) out.add(m[1]!);
  return [...out];
}

const resolve = (from: string, spec: string) => {
  const parts = from.split('/').slice(0, -1);
  for (const p of spec.split('/')) {
    if (p === '..') parts.pop();
    else if (p !== '.') parts.push(p);
  }
  return parts.join('/');
};

type Read = (path: string) => string | null;

/** Alle Module ab `start`, denen `follow` folgt (Pfade wie "/_astro/x.js") */
function closure(start: string[], read: Read, follow: (code: string) => string[]): string[] {
  const seen = new Set<string>();
  const queue = [...start];
  while (queue.length) {
    const file = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const code = read(file);
    if (code !== null) for (const spec of follow(code)) queue.push(resolve(file, spec));
  }
  return [...seen];
}

/** Alle Module, die beim Laden einer Seite geholt werden (Pfade wie "/_astro/x.js") */
export const loaded = (html: string, read: Read): string[] =>
  closure(
    scriptsOf(html).filter((s) => s.startsWith('/')),
    read,
    staticImports,
  );

/**
 * Nachgeladene Pakete einer Seite, die zu `chunks` passen, je mit den Dateien, die es nachlädt: das Paket und seine
 * statischen Importe, ohne das, was die Seite beim Laden schon hat und was die Pakete aus `after` samt ihren statischen
 * Importen mitbringen
 */
export function packs(html: string, read: Read, chunks: RegExp, after?: RegExp): { file: string; files: string[] }[] {
  const core = loaded(html, read);
  const all = closure(core, read, (code) => [...staticImports(code), ...dynamicImports(code)]);
  const before = after ? all.filter((f) => after.test(f)) : [];
  const have = new Set([...core, ...closure(before, read, staticImports)]);
  return all
    .filter((f) => chunks.test(f))
    .map((file) => ({ file, files: closure([file], read, staticImports).filter((f) => f === file || !have.has(f)) }));
}

const size = (code: string) => new TextEncoder().encode(code).length;

/** Bytes und Verbotenes in Dateien; fehlende Dateien sind ein Verstoß */
function measure(page: string, files: string[], read: Read, rule: Rule, problems: string[]): number {
  let bytes = 0;
  for (const f of files) {
    const code = read(f);
    if (code === null) {
      problems.push(`${page}: ${f} fehlt in dist`);
      continue;
    }
    bytes += size(code);
    if (rule.forbidden.test(code) || rule.forbidden.test(f))
      problems.push(`${page}: ${f} enthält Verbotenes für „${rule.name}“ (${rule.forbidden})`);
  }
  return bytes;
}

/** Verstöße nachgeladener Pakete gegen ihre Regel: mit `chunks` je Paket, mit `parts` alle zusammen */
function checkPacks(page: string, html: string, read: Read, rule: Rule, usage: Usage[]): string[] {
  const parts: Part[] = rule.parts ?? (rule.chunks ? [{ chunks: rule.chunks, after: rule.after }] : []);
  const core = new Set(loaded(html, read));
  const problems: string[] = [];
  const groups: { file: string; files: string[] }[] = [];
  for (const part of parts) {
    const found = packs(html, read, part.chunks, part.after);
    if (!found.length) problems.push(`${page}: kein nachgeladenes Paket für „${rule.name}“ (${part.chunks})`);
    for (const { file } of found)
      if (core.has(file))
        problems.push(`${page}: ${file} kommt schon beim Laden, nicht erst per import() („${rule.name}“)`);
    groups.push(...found);
  }
  if (problems.length) return problems;
  const together = rule.parts
    ? [{ file: groups.map((g) => g.file).join(' + '), files: [...new Set(groups.flatMap((g) => g.files))] }]
    : groups;
  for (const { file, files } of together) {
    const bytes = measure(page, files, read, rule, problems);
    usage.push({ rule: rule.name, page, file, bytes });
    if (bytes > rule.budget)
      problems.push(
        `${page}: ${file} lädt ${bytes} Bytes JavaScript nach, erlaubt sind ${rule.budget} („${rule.name}“)`,
      );
  }
  return problems;
}

/** Verstöße einer Seite gegen die Regeln (leer = alles gut); `usage` sammelt die gemessenen Größen */
export function check(page: string, html: string, read: Read, rules: Rule[], usage: Usage[] = []): string[] {
  const files = loaded(html, read);
  const problems: string[] = [];
  for (const rule of rules) {
    if (!rule.pages.test(page)) continue;
    if (rule.chunks || rule.parts) {
      problems.push(...checkPacks(page, html, read, rule, usage));
      continue;
    }
    let bytes = measure(page, files, read, rule, problems);
    // Eingebettete Skripte zählen mit: ins Budget und bei Verbotenem (z. B. eine Anmeldung des Service Workers)
    for (const [i, code] of inlineScriptsOf(html).entries()) {
      bytes += size(code);
      if (rule.forbidden.test(code))
        problems.push(
          `${page}: eingebettetes Skript ${i + 1} enthält Verbotenes für „${rule.name}“ (${rule.forbidden})`,
        );
    }
    usage.push({ rule: rule.name, page, bytes });
    if (bytes > rule.budget)
      problems.push(`${page}: ${bytes} Bytes JavaScript beim Laden, erlaubt sind ${rule.budget} („${rule.name}“)`);
  }
  return problems;
}
