import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('Google Health embeds stay within their containing block', async ({ page }) => {
  await page.goto('/case-googlehealth.html');

  const frames = await page.locator('iframe').evaluateAll((nodes) => nodes.map((frame) => {
    const box = frame.getBoundingClientRect();
    const parent = frame.parentElement.getBoundingClientRect();
    return {
      left: box.left,
      right: box.right,
      parentLeft: parent.left,
      parentRight: parent.right,
    };
  }));

  expect(frames.length).toBeGreaterThan(0);
  for (const frame of frames) {
    expect(frame.left).toBeGreaterThanOrEqual(frame.parentLeft - 1);
    expect(frame.right).toBeLessThanOrEqual(frame.parentRight + 1);
  }
});
