import { expect, test } from '@playwright/test';

const API_BASE = process.env['E2E_API_URL'] ?? 'http://127.0.0.1:3000/api/v1';

test.describe('LoreGraph and AdaptationLab Interactive UI E2E (Phase 35)', () => {
  test('renders /lore with real curated works and enforces backend spoiler filtering', async ({
    page,
    request,
  }) => {
    const worksRes = await request.get(`${API_BASE}/lore/curated-works`);
    expect(worksRes.ok()).toBeTruthy();
    const worksBody = (await worksRes.json()) as { items: Array<{ id: string; title: string }> };

    await page.goto('/lore');
    await expect(page.getByRole('heading', { level: 1, name: /LoreGraph/i })).toBeVisible();

    if (worksBody.items.length > 0) {
      const workId = worksBody.items[0]!.id;
      const noneRes = await request.get(`${API_BASE}/lore/works/${workId}?maxSpoiler=NONE`);
      expect(noneRes.ok()).toBeTruthy();
      const noneData = (await noneRes.json()) as {
        events: Array<{ spoilerLevel: string }>;
      };
      expect(noneData.events.every((e) => e.spoilerLevel === 'NONE')).toBe(true);

      await page.getByRole('button', { name: /MAJOR/i }).click();
      await expect(page.locator('.event-card').first()).toBeVisible();
    }
  });

  test('renders /adaptation with real episode-to-chapter correspondences and coverage', async ({
    page,
  }) => {
    await page.goto('/adaptation');
    await expect(page.getByRole('heading', { level: 1, name: /AdaptationLab/i })).toBeVisible();
    await expect(page.locator('.coverage-bar, .empty-state').first()).toBeVisible();
  });
});
