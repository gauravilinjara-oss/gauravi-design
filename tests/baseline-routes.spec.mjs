import { test, expect } from '@playwright/test';

for (const path of ['/', '/work.html', '/beyond.html', '/lab', '/blog.html', '/case-googlehealth.html']) {
  test(`${path} renders without a page error`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).not.toBeEmpty();
    const brokenImages = await page.locator('img').evaluateAll((images) => images
      .filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute('src'))
      .map((img) => img.getAttribute('src')));
    expect(brokenImages).toEqual([]);
  });
}
