import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173/chochi',
    browserName: 'chromium',
  },
  webServer: {
    command: 'npm --workspace frontend run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    cwd: '..',
  },
});
