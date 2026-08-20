import { test, expect } from '@playwright/test';

test('keyboard focus is visible on the global menu button', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const menu = page.locator('.gnav-burger');
  await expect(menu).toBeVisible();
  await menu.focus();

  const focus = await menu.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      visible: node.matches(':focus-visible'),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      ring: style.getPropertyValue('--focus-ring').trim(),
    };
  });

  expect(focus.visible).toBe(true);
  expect(focus.outlineStyle).not.toBe('none');
  expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2);
  expect(focus.ring).not.toBe('');
});

test('shared text tokens use readable colors on white', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return ['--faint', '--green', '--t-ink-faint', '--t-muted-on-dark', '--t-sage']
      .map((name) => [name, style.getPropertyValue(name).trim().toLowerCase()]);
  });

  expect(Object.fromEntries(tokens)).toEqual({
    '--faint': '#4e5f74',
    '--green': '#2f6cb8',
    '--t-ink-faint': '#4e5f74',
    '--t-muted-on-dark': '#4e5f74',
    '--t-sage': '#2f6cb8',
  });
});

test('homepage leads from the illustrated hero into selected work and a quick overview', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const heroOverview = page.locator('.hero a[href="quick.html"]');
  await expect(heroOverview).toBeVisible();
  await expect(heroOverview).toContainText('60-second overview');

  const order = await page.evaluate(() => ({
    work: document.querySelector('.sw-sec')?.getBoundingClientRect().top,
    stats: document.querySelector('#aiStatSec')?.getBoundingClientRect().top,
  }));
  expect(order.work).toBeLessThan(order.stats);
});

test('homepage credibility statement uses the quieter lowercase treatment', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const textTransform = await page.locator('#aiStat').evaluate((node) => getComputedStyle(node).textTransform);
  expect(textTransform).toBe('lowercase');
});

test('mobile homepage keeps the lighting control clear of the introduction', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1000) > 720, 'mobile-only behavior');
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#skyRail')).toBeHidden();
});

for (const path of ['/work.html', '/beyond.html']) {
  test(`${path} shows useful content without a loading-screen delay`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#pgx')).toBeHidden({ timeout: 250 });
    await expect(page.locator('h1')).toBeVisible();
  });
}

test('Podonos provides a useful public summary before asking for a passcode', async ({ page }) => {
  await page.goto('/case-podonos.html', { waitUntil: 'domcontentloaded' });
  const summary = page.locator('#gate .gate-summary');
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('Founding Product Designer');
  await expect(summary).toContainText('days to hours');
  await expect(summary).toContainText('Research, product design, and production frontend');
});

test('chat composer uses one clear focus treatment', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.gachat-launch').evaluate((button) => button.click());
  await page.locator('.gachat-form textarea').focus();

  const focus = await page.evaluate(() => {
    const input = getComputedStyle(document.querySelector('.gachat-form textarea'));
    const wrapper = getComputedStyle(document.querySelector('.gachat-inwrap'));
    return {
      inputOutline: input.outlineStyle,
      inputShadow: input.boxShadow,
      wrapperBorder: wrapper.borderStyle,
      wrapperBorderWidth: parseFloat(wrapper.borderWidth),
    };
  });

  expect(focus.inputOutline).toBe('none');
  expect(focus.inputShadow).toBe('none');
  expect(focus.wrapperBorder).toBe('solid');
  expect(focus.wrapperBorderWidth).toBeGreaterThanOrEqual(2);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('suppresses representative ambient and reveal motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const motions = await page
      .locator('.bee-wing, .i-rays, .ai-rv')
      .evaluateAll((nodes) => nodes.map((node) => ({
        className: node.className,
        duration: getComputedStyle(node).animationDuration,
      })));

    expect(motions.length).toBeGreaterThan(0);
    for (const motion of motions) {
      expect(['0s', '0.00001s'], String(motion.className)).toContain(motion.duration);
    }
  });
});
