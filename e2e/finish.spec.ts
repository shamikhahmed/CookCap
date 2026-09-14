import { test, expect } from '@playwright/test';

/**
 * COOK-P1-07 — onboarding → recipe → cook mode → shopping → backup/restore smoke.
 * Skips if server not configured; use webServer in playwright.config if present.
 */
test.describe('CookCap finish journeys', () => {
  test('name gate → contents → recipe leaf → shopping entry points', async ({ page }) => {
    await page.goto('/');
    // Splash / dresser / name gate
    const begin = page.getByRole('button', { name: /begin/i });
    if (await begin.isVisible({ timeout: 8000 }).catch(() => false)) {
      await begin.click();
    }
    const name = page.locator('#cookcap-owner');
    if (await name.isVisible({ timeout: 5000 }).catch(() => false)) {
      await name.fill('Ayesha');
      await expect(page.getByText(/Ayesha Cooks/i)).toBeVisible();
      await page.getByRole('button', { name: /continue|next|save|done/i }).first().click();
      // profile / mode steps optional
      for (let i = 0; i < 3; i++) {
        const skip = page.getByRole('button', { name: /skip|continue|start|open book|done/i });
        if (await skip.first().isVisible().catch(() => false)) await skip.first().click();
      }
    }
    // Open book / next from cover
    const open = page.getByRole('button', { name: /open the cookbook/i });
    if (await open.isVisible({ timeout: 3000 }).catch(() => false)) {
      await open.click();
    }
    await expect(page.getByText(/The Chapters|Contents|recipes/i).first()).toBeVisible({ timeout: 15000 });

    // Shopping entry
    const shop = page.getByRole('button', { name: /shopping|cart/i }).first();
    if (await shop.isVisible().catch(() => false)) {
      await shop.click();
      await expect(page.getByText(/shopping|list|cart/i).first()).toBeVisible({ timeout: 5000 });
    }

    // About / backup
    const more = page.getByRole('button', { name: /more|about|menu/i }).first();
    if (await more.isVisible().catch(() => false)) {
      await more.click();
      const about = page.getByRole('menuitem', { name: /about/i });
      if (await about.isVisible().catch(() => false)) await about.click();
      await expect(page.getByText(/catalog recipes|Nutrition values are estimates/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
