import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'gallery-v3.spec.ts',
  timeout: 300_000,
  fullyParallel: false,
  workers: 1,
  use: { trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
