import { expect, test } from '@playwright/test';

// The landing navbar is intentionally hidden until the visitor scrolls past
// 70% of the hero. Reveal it first, then check that its links land the section
// heading just below the fixed bar (nav bottom = 72px), not ~208px down.
for (const [label, id] of [
  ['Fasilitas', 'story-title'],
  ['Rundown', 'rundown-title'],
] as const) {
  test(`nav "${label}" lands its heading below the nav, not far down`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await page.evaluate(() =>
      window.scrollTo({ top: window.innerHeight * 0.75, behavior: 'instant' }),
    );
    await expect(page.locator('.floating-nav')).toHaveClass(/is-visible/);

    await page.locator('.floating-nav').getByRole('link', { name: label, exact: true }).click();
    await page.waitForTimeout(1200); // smooth scroll to settle
    await expect(page.locator(`#${id}`)).toBeInViewport();
    const box = await page.locator(`#${id}`).boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(88);
    expect(box!.y).toBeLessThanOrEqual(170);
  });
}
