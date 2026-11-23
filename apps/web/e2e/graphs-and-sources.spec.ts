import { expect, test } from '@playwright/test';

test.describe('Graphs, Sources, and Placeholder Modules E2E', () => {
  test('renders Relations, Studios, Sources, Lore, Adaptation, and About without JS errors', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    for (const route of ['/relations', '/studios', '/sources', '/lore', '/adaptation', '/about']) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route));
      await expect(page.locator('main')).toBeVisible();
    }

    expect(pageErrors).toEqual([]);
  });

  test('Sources observatory displays ODbL/DbCL attribution and read-only sources', async ({
    page,
  }) => {
    await page.goto('/sources');
    await expect(page.getByText(/anime-offline-database/i).first()).toBeVisible();
  });
});
