import { expect, test } from '@playwright/test';

// Clicking a top-nav link must land the section heading just below the
// floating nav (nav bottom = 20px top offset + 68px height = 88px),
// not ~208px down (the old double scroll-padding + scroll-margin offset).
for (const [label, id] of [
  ['Info Acara', 'event-info-title'],
  ['Rundown', 'rundown-title'],
] as const) {
  test(`nav "${label}" lands its heading below the nav, not far down`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.getByRole('link', { name: label, exact: true }).click();
    await page.waitForTimeout(1200); // smooth scroll to settle
    await expect(page.locator(`#${id}`)).toBeInViewport();
    const box = await page.locator(`#${id}`).boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(88);
    // 104px nav offset + 48px section padding + heading margin ≈ 161; anything
    // near 264 would mean the old double offset came back.
    expect(box!.y).toBeLessThanOrEqual(170);
  });
}
