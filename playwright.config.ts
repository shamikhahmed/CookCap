import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  use: { baseURL: 'http://127.0.0.1:18231', headless: true },
  webServer: {
    command: 'npx --yes serve out -l 18231',
    url: 'http://127.0.0.1:18231',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
