import { expect, test } from '@playwright/test';

const API_BASE = process.env['E2E_API_URL'] ?? 'http://127.0.0.1:3000/api/v1';

test.describe('Catalog and Discovery E2E', () => {
  test('loads catalog without uncaught JS errors and matches API pagination', async ({
    page,
    request,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const apiRes = await request.get(`${API_BASE}/anime?page=1&pageSize=24`);
    expect(apiRes.ok()).toBeTruthy();
    const apiBody = (await apiRes.json()) as { items: Array<{ id: string; title: string }> };
    expect(apiBody.items.length).toBeGreaterThan(0);

    await page.goto('/catalog');
    await expect(page).toHaveURL(/\/catalog/);
    await expect(page.locator('main')).toBeVisible();

    const firstTitle = apiBody.items[0]!.title;
    await expect(page.getByText(firstTitle, { exact: false }).first()).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('navigates to anime detail and supports back/forward navigation', async ({
    page,
    request,
  }) => {
    const apiRes = await request.get(`${API_BASE}/anime?q=bebop&page=1&pageSize=5`);
    expect(apiRes.ok()).toBeTruthy();
    const apiBody = (await apiRes.json()) as { items: Array<{ id: string; title: string }> };
    expect(apiBody.items.length).toBeGreaterThan(0);

    const target = apiBody.items[0]!;
    await page.goto(`/catalog/${target.id}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(target.title);

    await page.goto('/catalog');
    await expect(page).toHaveURL(/\/catalog$/);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/catalog/${target.id}`));
  });

  test('redirects unknown routes safely back to catalog', async ({ page }) => {
    await page.goto('/rota-inexistente-e2e');
    await expect(page).toHaveURL(/\/catalog/);
  });
});
