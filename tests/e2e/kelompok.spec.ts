import { expect, test } from '@playwright/test';

test.describe('halaman pembagian kelompok', () => {
  test('menampilkan dua kelompok, pencarian, dan tidak melebar di HP', async ({ page }) => {
    await page.goto('/kelompok');

    await expect(page.getByRole('heading', { level: 1, name: 'Pembagian Kelompok' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Kelompok A' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Kelompok B' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Kelompok C' })).toHaveCount(0);
    await expect(page.locator('.group-stat')).toHaveCount(0);
    await expect(page.locator('.group-card__counts')).toHaveCount(0);
    await expect(page.locator('.group-member__count')).toHaveCount(0);

    const search = page.getByLabel('Cari nama atau sekolah');
    await expect(search).toBeVisible();

    const firstMember = page.locator('.group-member strong').first();
    const memberName = (await firstMember.textContent())?.trim() ?? '';
    expect(memberName.length).toBeGreaterThan(0);

    await search.fill(memberName);
    await expect(page.locator('.group-member strong').first()).toHaveText(memberName);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('halaman tidak diindeks mesin pencari', async ({ page }) => {
    await page.goto('/kelompok');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });
});
