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
