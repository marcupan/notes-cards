import {test, expect} from '@playwright/test';

test('home loads and shows header', async ({page}) => {
    await page.goto('/');
    await expect(page.getByText('Anki Chinese')).toBeVisible();
});

test('health endpoint returns ok', async ({request}) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.ok).toBe(true);
});

test('preflight unauthenticated prompts sign in', async ({page}) => {
    await page.goto('/admin/preflight');
    await expect(page.getByText(/sign in/i)).toBeVisible();
});

