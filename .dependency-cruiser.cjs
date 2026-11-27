// Architekturregeln (Guard-Gate, `npm run arch`): die Schichten der Seite, maschinell geprüft.
//   src/lib       generische Bausteine (Würfel-Grafik beim Build) – kennt keine Seiteninhalte
//   src/data      Inhalte und Konfiguration der Seite – nutzt lib, kennt keine Oberfläche
//   components, layouts, pages – Oberfläche, darf alles darunter nutzen
// Eigenes JavaScript im Browser gibt es nicht (Bundle-Gate, scripts/verify-bundles.ts).
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Zyklen machen Module untrennbar und die Ladereihenfolge zufällig.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'lib-is-generic',
      severity: 'error',
      comment: 'src/lib ist der generische Unterbau. Inhalte kommen als Parameter, nicht per Import.',
      from: { path: '^src/lib/' },
      to: { path: '^src/(data|components|layouts|pages)/' },
    },
    {
      name: 'data-knows-no-ui',
      severity: 'error',
      comment: 'Daten und Konfiguration hängen nicht von Komponenten, Layouts oder Seiten ab.',
      from: { path: '^src/data/' },
      to: { path: '^src/(components|layouts|pages)/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '^(dist|\\.astro)/' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    // Paket-Unterpfade wie astro/zod über das exports-Feld auflösen
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'types', 'default'] },
  },
};
