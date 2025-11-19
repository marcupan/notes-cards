import type { PlaywrightTestConfig } from '@playwright/test';

const isCI = !!process.env.CI;

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const useExternal = !!process.env.PLAYWRIGHT_BASE_URL;

const config: PlaywrightTestConfig = {
  testDir: 'tests',
  timeout: 30_000,
  retries: isCI ? 2 : 0,
  reporter: [['html', { open: 'never' }]],
  webServer: useExternal
    ? undefined
    : {
        command: 'npm run build && npm start',
        port: 3000,
        timeout: 120_000,
        reuseExistingServer: !isCI,
        env: {
          NEXT_TELEMETRY_DISABLED: '1',
          NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || 'https://example.convex.cloud',
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'test_key',
          CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'test_secret',
        },
      },
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
  },
};

export default config;
