// Unit-Tests für die reine Logik (Würfel-Grafik, Seitendaten, Bundle- und Seiten-Gate). Kein DOM, kein Astro nötig.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/data/site.ts', 'scripts/{bundles,dist}.ts'],
      reporter: [['text', { skipFull: true }], 'text-summary'],
      // Knapp unter dem gemessenen Stand: Sinkt die Abdeckung, fällt das Gate. Steigt sie, die Schwellen mitziehen.
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
});
