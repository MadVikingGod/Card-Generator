const fs = require('fs');
const { defineConfig, devices } = require('@playwright/test');

// Some sandboxed dev environments ship a pre-installed Chromium whose build may
// not match the installed Playwright version. When that binary is present, launch
// it directly; otherwise (e.g. in CI) use the browsers from `npx playwright install`.
const preinstalledChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const executablePath = fs.existsSync(preinstalledChromium) ? preinstalledChromium : undefined;

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:8080',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
  webServer: {
    command: 'python3 -m http.server 8080 --directory dist',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
