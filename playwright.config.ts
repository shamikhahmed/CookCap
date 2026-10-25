import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  use: { baseURL: 'http://127.0.0.1:8831', headless: true },
  webServer: {
    command: 'npx --yes serve out -l 8831',
    url: 'http://127.0.0.1:8831',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
