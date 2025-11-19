import { test, expect } from '@playwright/test';

const LIVE = process.env.E2E_LIVE === '1';
const EMAIL = process.env.E2E_CLERK_EMAIL || '';
const PASSWORD = process.env.E2E_CLERK_PASSWORD || '';
const DO_GENERATE = process.env.E2E_GENERATE === '1';
const IS_ADMIN = process.env.E2E_ADMIN === '1';

// Only run when explicitly enabled and credentials provided
LIVE && EMAIL && PASSWORD || test.skip(true, 'Live E2E disabled or missing credentials');

test('sign in, create folder, optionally generate card', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');

  // Open sign in
  await page.getByRole('button', { name: /sign in/i }).first().click();

  // Clerk hosted SignIn component
  // Fill email and password inputs; labels may vary with Clerk settings
  await page.getByLabel(/email/i).fill(EMAIL);
  // Some Clerk themes use placeholders; try a fallback
  if (!(await page.getByLabel(/password/i).count())) {
    await page.getByPlaceholder(/password/i).first().fill(PASSWORD);
  } else {
    await page.getByLabel(/password/i).fill(PASSWORD);
  }
  // Submit
  const signInSubmit = page.getByRole('button', { name: /sign in/i });
  if (await signInSubmit.count()) {
    await signInSubmit.first().click();
  } else {
    // Fallback: press Enter
    await page.keyboard.press('Enter');
  }

  // Wait for header to show SignedIn state (UserButton present)
  await expect(page.getByRole('button', { name: /user menu|open user menu/i }).or(page.getByText(/sign out/i))).toBeVisible({ timeout: 30_000 });

  // Create a folder
  const newFolderName = `e2e-${Date.now()}`;
  await page.getByPlaceholder('New folder').fill(newFolderName);
  await page.getByRole('button', { name: /add/i }).click();
  // Should appear in list and be selected
  await expect(page.getByText(newFolderName)).toBeVisible();

  // Optionally generate a card
  if (DO_GENERATE) {
    await page.getByPlaceholder('Enter Chinese word').fill('你好');
    await page.getByRole('button', { name: /generate/i }).click();
    // Wait for toast or new card tile
    const toast = page.getByText(/card generated/i);
    const cardTile = page.getByText('你好');
    await Promise.race([
      toast.waitFor({ state: 'visible', timeout: 60_000 }),
      cardTile.waitFor({ state: 'visible', timeout: 60_000 }),
    ]);
    await expect(cardTile.or(toast)).toBeVisible();

    // Edit card via modal
    await cardTile.first().click(); // flip card
    // Open Edit modal
    await page.getByRole('button', { name: /edit/i }).first().click();
    const translationInput = page.getByLabel('Translation', { exact: false }).or(page.locator('input').nth(0));
    await translationInput.fill('hello (updated)');
    await page.getByRole('button', { name: /^save$/i }).last().click();
    await expect(page.getByText(/card updated/i)).toBeVisible({ timeout: 30_000 });

    // Create another folder for move target
    const moveFolder = `e2e-move-${Date.now()}`;
    await page.getByPlaceholder('New folder').fill(moveFolder);
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(moveFolder)).toBeVisible();

    // Re-select original folder to see the card
    await page.getByText(newFolderName, { exact: true }).click();
    // Open Move modal
    await page.getByRole('button', { name: /move/i }).first().click();
    await page.locator('select').first().selectOption({ label: moveFolder }).catch(async () => {
      // Fallback select by value when label not matched
      const opt = await page.locator(`option:has-text("${moveFolder}")`).first().getAttribute('value');
      if (opt) await page.locator('select').first().selectOption(opt);
    });
    await page.getByRole('button', { name: /^move$/i }).last().click();
    await expect(page.getByText(/card moved/i)).toBeVisible({ timeout: 30_000 });

    // Optionally delete (admin-only UI)
    if (IS_ADMIN) {
      // Go to moveFolder and delete the card there
      await page.getByText(moveFolder, { exact: true }).click();
      // Click Delete on first card
      const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
      await deleteBtn.click();
      await expect(page.getByText(/card deleted/i)).toBeVisible({ timeout: 30_000 });
    }
  }
});
