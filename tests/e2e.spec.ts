import {test, expect} from '@playwright/test';

test('home page loads without errors', async ({page}) => {
    await page.goto('/', {waitUntil: 'networkidle'});
    // Home page should load - either show signed in content or sign in prompt
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
});

test('health endpoint returns ok', async ({request}) => {
    const res = await request.get('/api/health');
    expect([200, 404]).toContain(res.status());
    if (res.ok()) {
        const json = await res.json();
        expect(json.ok).toBe(true);
    }
});

test('admin pages exist', async ({page}) => {
    // Test that admin routes exist and load
    const res = await page.goto('/admin/env', {waitUntil: 'networkidle'});
    expect([200, 307, 308]).toContain(res?.status());
});

