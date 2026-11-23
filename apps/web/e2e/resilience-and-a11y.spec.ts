import { expect, test } from '@playwright/test';

test.describe('Resilience, Responsive Layout, and Accessibility E2E', () => {
  test('handles API 500 gracefully without crashing the app shell', async ({ page }) => {
    await page.route('**/api/v1/anime**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'about:blank',
          title: 'Internal Server Error',
          status: 500,
          detail: 'Simulated outage',
        }),
      }),
    );

    await page.goto('/catalog');
    await expect(page.locator('main')).toBeVisible();
  });

  test('has no horizontal overflow on desktop and mobile viewports', async ({ page }) => {
    for (const route of ['/catalog', '/studios', '/sources', '/about']) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();

      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      );
      expect(hasOverflow, `Horizontal overflow detected on ${route}`).toBeFalsy();
    }
  });

  test('supports keyboard Tab navigation from top of document', async ({ page }) => {
    await page.goto('/catalog');
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? '');
    expect(focusedTag).not.toBe('');
    expect(focusedTag).not.toBe('BODY');
  });
});
