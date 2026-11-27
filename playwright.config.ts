// Smoke-Test im Browser (Guard-Gate nach dem Build): Die fertige Seite aus dist/ wird ausgeliefert und in Chromium
// geöffnet. Prüft, was statische Gates nicht sehen: dass die Seiten laufen, ohne Fehler in der Konsole, barrierefrei,
// und dass der Ablöse-Service-Worker unter /spielen/ alte Installationen des Spiels abmeldet.
// Einmalig lokal: npx playwright install chromium
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // Höchstens 2 Worker, auch lokal: Der GitHub-Runner hat 4 vCPUs; Container melden alle Kerne des Wirts.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  expect: { timeout: process.env.CI ? 15_000 : 5_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4321', trace: 'retain-on-failure' },
  projects: [{ name: 'site', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'node e2e/serve.ts', url: 'http://localhost:4321', reuseExistingServer: !process.env.CI },
});
