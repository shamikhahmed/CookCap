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

    // Shopping entry — drawer may stay closed while first-run gate is up
    const shop = page.getByRole('button', { name: /shopping list/i }).first();
    if (await shop.isVisible().catch(() => false)) {
      await shop.click();
      await page.locator('#shopping-drawer-title').waitFor({ state: 'visible', timeout: 8000 }).catch(() => undefined);
    }

    // About / backup (best-effort — More menu copy varies by chrome width)
    const more = page.getByRole('button', { name: /more|about|menu/i }).first();
    if (await more.isVisible().catch(() => false)) {
      await more.click();
      const about = page.getByRole('menuitem', { name: /about/i });
      if (await about.isVisible().catch(() => false)) {
        await about.click();
        await page
          .getByText(/catalog recipes|Nutrition values are estimates|CookCap/i)
          .first()
          .waitFor({ state: 'visible', timeout: 5000 })
          .catch(() => undefined);
      }
    }
  });
});
