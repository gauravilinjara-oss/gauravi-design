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

    await expect(page.locator('#caserail:visible,#caseMobileNav:visible,#secnav:visible')).toHaveCount(1);
    expect(await page.locator('#caserail,#caseMobileNav').evaluateAll((navigators) => {
      const content = document.querySelector('body > main, body > header.hero, body > section');
      return navigators.every((navigator) => Boolean(
        navigator.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING
      ));
    })).toBe(true);

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('case prose matches the Bridgeway contrast and callout hierarchy', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/case-podonos.html');

  const styles = await page.evaluate(() => {
    const prose = getComputedStyle(document.querySelector('.section-lede'));
    const label = getComputedStyle(document.querySelector('.snapshot .eyebrow'));
    const callout = getComputedStyle(document.querySelector('.reframe .re-line'));
    return {
      proseColor: prose.color,
      labelColor: label.color,
      calloutColor: callout.color,
      calloutSize: callout.fontSize,
      calloutLeading: callout.lineHeight,
    };
  });

  expect(styles).toEqual({
    proseColor: 'rgb(78, 95, 116)',
    labelColor: 'rgb(50, 64, 79)',
    calloutColor: 'rgb(78, 95, 116)',
    calloutSize: '22px',
    calloutLeading: '30.8px',
  });
});

test('case introductions use one text color without highlight treatments', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'));
  await page.goto('/case-podonos.html');

  const styles = await page.evaluate(() => {
    const hero = document.querySelector('header.hero .lede');
    const mark = hero.querySelector('.mk');
    const heroBold = mark.querySelector('b');
    const section = [...document.querySelectorAll('.section-lede')]
      .find((element) => element.textContent.includes('Is this voice good?'));
    const sectionBold = section.querySelector('b');
    const read = (element) => {
      const style = getComputedStyle(element);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        fontWeight: style.fontWeight,
      };
    };
    return { hero: read(hero), mark: read(mark), heroBold: read(heroBold), section: read(section), sectionBold: read(sectionBold) };
  });

  expect(styles.mark).toEqual(styles.hero);
  expect(styles.heroBold).toEqual(styles.hero);
  expect(styles.sectionBold).toEqual(styles.section);
  expect(styles.mark.backgroundImage).toBe('none');
  expect(styles.mark.backgroundColor).toBe('rgba(0, 0, 0, 0)');
});

test('all case-study paragraphs use one inline emphasis treatment', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'));

  for (const path of cases) {
    await page.goto(path);
    const failures = await page.evaluate(() => {
      const transparent = 'rgba(0, 0, 0, 0)';
      const results = [];
      document.querySelectorAll('p').forEach((paragraph, paragraphIndex) => {
        const base = getComputedStyle(paragraph);
        paragraph.querySelectorAll('b,strong,em,.mk').forEach((element) => {
          const style = getComputedStyle(element);
          const mismatch = style.color !== base.color
            || style.fontWeight !== base.fontWeight
            || style.fontStyle !== 'normal'
            || style.backgroundColor !== transparent
            || style.backgroundImage !== 'none';
          if (mismatch) {
            results.push({
              paragraphIndex,
              tag: element.tagName,
              className: element.className,
              text: element.textContent.trim().slice(0, 80),
              base: { color: base.color, fontWeight: base.fontWeight },
              actual: {
                color: style.color,
                fontWeight: style.fontWeight,
                fontStyle: style.fontStyle,
                backgroundColor: style.backgroundColor,
                backgroundImage: style.backgroundImage,
              },
            });
          }
        });
      });
      return results;
    });
    expect(failures, path).toEqual([]);
  }
});

test('case-study reframe labels use the shared editorial ink', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'));
  for (const path of cases) {
    await page.goto(path);
    const labels = page.locator('.reframe .re-eyebrow');
    for (let index = 0; index < await labels.count(); index += 1) {
      await expect(labels.nth(index), path).toHaveCSS('color', 'rgb(50, 64, 79)');
    }
  }
});

test('case content clears the desktop rail at every supported desktop boundary', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'));

  for (const path of cases) {
    await page.setViewportSize({ width: 1180, height: 900 });
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#caserail')).toBeVisible();

    for (const width of [1180, 1280, 1366, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => new Promise(requestAnimationFrame));
      const geometry = await page.evaluate(() => {
        const rail = document.querySelector('#caserail').getBoundingClientRect();
        const flow = Array.from(document.querySelectorAll(
          'body > main, body > header.hero, body > section, body > footer'
        )).filter((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.height > 0;
        }).map((element) => ({
          tag: element.tagName,
          id: element.id,
          left: element.getBoundingClientRect().left,
        }));
        return { railRight: rail.right, flow };
      });

      expect(geometry.flow.length, `${path} at ${width}px`).toBeGreaterThan(0);
      for (const entry of geometry.flow) {
        expect(entry.left, `${path} ${entry.tag}#${entry.id} at ${width}px`)
          .toBeGreaterThanOrEqual(geometry.railRight - .5);
      }
    }
  }
});

test('case content remains full width on mobile', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'));

  for (const path of cases) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    const geometry = await page.evaluate(() => {
      const content = document.querySelector('body > main, body > header.hero, body > section');
      const rect = content.getBoundingClientRect();
      return {
        paddingLeft: Number.parseFloat(getComputedStyle(document.body).paddingLeft),
        left: rect.left,
        right: rect.right,
      };
    });
    expect(geometry.paddingLeft, path).toBe(0);
    expect(geometry.left, path).toBeCloseTo(0, 1);
    expect(geometry.right, path).toBeCloseTo(390, 1);
  }
});

test('intermediate desktop exposes exactly one case navigator', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'));
  await page.setViewportSize({ width: 1024, height: 900 });

  for (const path of cases) {
    await page.goto(path);
    await expect(page.locator('#caserail:visible,#caseMobileNav:visible,#secnav:visible')).toHaveCount(1);
    await expect(page.locator('#caseMobileNav')).toBeVisible();
  }
});

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

test('case studies remain visible with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/case-googlehealth.html');

  const hidden = await page
    .locator('.rv,.reveal,.words .wcard,.shiftblk .new')
    .evaluateAll((nodes) => nodes.filter((node) => getComputedStyle(node).opacity === '0').length);

  expect(hidden).toBe(0);
});

test('substantive reveal modules remain visible with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto('/case-googlehealth.html');
  await expect(page.locator('.rv')).not.toHaveCount(0);
  expect(await page.locator('.rv').evaluateAll((nodes) => nodes.filter((node) => {
    const style = getComputedStyle(node);
    return style.opacity === '0' || style.visibility === 'hidden';
  }).length)).toBe(0);

  await page.goto('/case-mashreq.html');
  await expect(page.locator('.reveal')).not.toHaveCount(0);
  await expect(page.locator('.words .wcard')).not.toHaveCount(0);
  await expect(page.locator('.shiftblk')).not.toHaveCount(0);
  expect(await page.locator('.reveal,.words .wcard,.shiftblk .new,.shiftblk .arw,.shiftblk .ssub')
    .evaluateAll((nodes) => nodes.filter((node) => {
      const style = getComputedStyle(node);
      return style.opacity === '0' || style.visibility === 'hidden';
    }).length)).toBe(0);

  await context.close();
});

test('anchored chapter is not hidden by sticky navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/case-mashreq.html#research');
  await page.locator('#research').evaluate((node) => node.scrollIntoView({ block: 'start' }));

  const targetTop = await page.locator('#research').evaluate((node) => node.getBoundingClientRect().top);
  const navigationBottom = await page.locator('#caseMobileNav').evaluate((node) => {
    return getComputedStyle(node).display === 'none' ? 0 : node.getBoundingClientRect().bottom;
  });

  expect(targetTop).toBeGreaterThanOrEqual(Math.max(88, navigationBottom));
});

test('case studies do not initialize decorative tilt', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'));
  await page.goto('/case-googlehealth.html');

  await page.evaluate(async () => {
    document.body.setAttribute('data-cine', 'tilt');
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/cinematic.js?tilt-test=${Date.now()}`;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  });

  await expect(page.locator('.snap-card')).not.toHaveClass(/cn-tilt/);
});
