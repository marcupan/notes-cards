import type {PlaywrightTestConfig} from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const isCI = !!process.env.CI;

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const useExternal = !!process.env.PLAYWRIGHT_BASE_URL;

const config: PlaywrightTestConfig = {
    testDir: 'tests',
    timeout: 30_000,
    retries: isCI ? 2 : 0,
    reporter: [['html', {open: 'never'}]],
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
                NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_',
                CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'sk_test_',
                ...(process.env.CLERK_JWT_ISSUER_DOMAIN && { CLERK_JWT_ISSUER_DOMAIN: process.env.CLERK_JWT_ISSUER_DOMAIN }),
            },
        },
    use: {
        baseURL,
        headless: true,
        trace: 'retain-on-failure',
    },
};

export default config;
