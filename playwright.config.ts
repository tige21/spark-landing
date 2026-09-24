import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    // Dedicated port, not Astro's default 4321: with reuseExistingServer a dev
    // server from ANY other project sitting on 4321 was silently adopted, and
    // the whole suite ran green-ish against a different website.
    baseURL: 'http://localhost:4351',
    trace: 'off',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4351',
    url: 'http://localhost:4351',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
