import { expect, test } from '@playwright/test';

test.describe('Authentication Entry', () => {
  test('redirects unauthenticated users to password entry', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/password-entry');
    await expect(page.getByText(/use your gmail to login/i)).toBeVisible();
  });

  test('shows the sign-in CTA on password entry', async ({ page }) => {
    await page.goto('/password-entry');
    await expect(page.getByRole('button')).toContainText(/google|sign in|login/i);
  });
});
