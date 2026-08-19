import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('About active media and captions stay inside the viewport', async ({ page }) => {
  await page.goto('/beyond.html');
  await expect(page.locator('.sf-card.is-active')).toHaveCount(1);

  const overflow = await page
    .locator('.sf-card.is-active img, .sf-card.is-active video, .sf-card.is-active .t, .sf-card.is-active .s')
    .evaluateAll((nodes) => nodes.filter((node) => {
      const box = node.getBoundingClientRect();
      return box.left < -1 || box.right > document.documentElement.clientWidth + 1;
    }).length);

  expect(overflow).toBe(0);
});

test('About small controls have a 44px hit area', async ({ page }) => {
  await page.goto('/beyond.html');
  await expect(page.locator('.rdot').first()).toBeAttached();

  const boxes = await page
    .locator('button[aria-label^="show quote"], .sf-nav button, .gnav-burger')
    .evaluateAll((nodes) => nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }));

  expect(boxes.length).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});
