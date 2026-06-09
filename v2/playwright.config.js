import { defineConfig, devices } from '@playwright/test';

// Playwright config for V2. Runs headless Chromium against a dev server on
// port 5173. The test mocks /api/* so no network credentials are required.
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    headless: true
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/mobile-*.spec.js'
    },
    // iPhone emulation (WebKit engine + touch + 390x844 viewport).
    // Substitutes for the physical phone test where emulation is
    // meaningful: layout at mobile width, touch taps, scroll
    // geometry, drag slot targeting with mixed-height rows, edit
    // input keyboard-occlusion defense (scrollIntoView). True
    // device behaviors (rubber-band scroll, haptics, real keyboard,
    // PWA install) remain un-emulatable.
    {
      name: 'iphone',
      use: { ...devices['iPhone 13'] },
      testMatch: '**/mobile-*.spec.js'
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
