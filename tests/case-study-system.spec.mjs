import { test, expect } from '@playwright/test';

const cases = [
  '/case-podonos.html', '/case-fxonline.html', '/case-smarttrade.html',
  '/case-business.html', '/case-mashreq.html', '/case-googlehealth.html',
];

for (const path of cases) {
  test(`${path} exposes the editorial navigation`, async ({ page }, testInfo) => {
    await page.goto(path);
    await expect(page.locator('body')).toHaveCSS('font-family', /Satoshi/);

    const expectedTargets = await page
      .locator('header.hero, section:has(.sec-head .eyebrow)')
      .evaluateAll((elements) => elements.map((element) => element.id));

    expect(expectedTargets.length).toBeGreaterThan(1);
    expect(new Set(expectedTargets).size).toBe(expectedTargets.length);
    expect(expectedTargets.every(Boolean)).toBe(true);

    if (testInfo.project.name.startsWith('desktop')) {
      await expect(page.locator('#caserail')).toBeVisible();
      await expect(page.locator('#caserail nav a')).toHaveCount(expectedTargets.length);
      expect(await page.locator('#caserail nav a').evaluateAll((links) =>
        links.map((link) => link.getAttribute('href')?.slice(1))))
        .toEqual(expectedTargets);
    } else {
      await expect(page.locator('#caserail')).toBeHidden();
      await expect(page.locator('#caseMobileNav')).toBeVisible();
      await expect(page.locator('#caseSectionSelect option')).toHaveCount(expectedTargets.length);
    }

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('desktop navigation updates the URL and honors reduced motion', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const scrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollWithRecordedOptions(options) {
      window.__caseScrollOptions = options;
      scrollIntoView.call(this, options);
    };
  });
  await page.goto('/case-podonos.html');

  const links = page.locator('#caserail nav a');
  await expect(page.locator('#caserail nav a[aria-current="location"]')).toHaveCount(1);
  const target = await links.nth(1).getAttribute('href');
  await links.nth(1).evaluate((link) => link.click());

  await expect(page).toHaveURL(new RegExp(`${target}$`));
  expect(await page.evaluate(() => window.__caseScrollOptions)).toEqual({
    behavior: 'auto',
    block: 'start',
  });
  await expect(links.nth(1)).toHaveAttribute('aria-current', 'location');
});

test('mobile navigation changes sections and follows reading position', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const scrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollWithRecordedOptions(options) {
      window.__caseScrollOptions = options;
      scrollIntoView.call(this, options);
    };
  });
  await page.goto('/case-podonos.html');

  const entries = page.locator('header.hero, section:has(.sec-head .eyebrow)');
  const select = page.locator('#caseSectionSelect');
  const selectedTarget = await entries.nth(1).getAttribute('id');

  await select.selectOption('1');

  await expect(page).toHaveURL(new RegExp(`#${selectedTarget}$`));
  expect(await page.evaluate(() => window.__caseScrollOptions)).toEqual({
    behavior: 'auto',
    block: 'start',
  });
  await expect(select).toHaveValue('1');

  await entries.nth(2).evaluate((entry) => {
    const top = entry.getBoundingClientRect().top + window.scrollY - window.innerHeight * .05;
    window.scrollTo({ top, behavior: 'auto' });
  });

  await expect(select).toHaveValue('2');
});
