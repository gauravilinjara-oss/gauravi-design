# Portfolio Consistency and Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the audited typography, color, motion, responsive, semantic, and content inconsistencies while preserving the portfolio's illustrated identity.

**Architecture:** Shared tokens and navigation components remain static CSS/JavaScript files under `mockups/`; each page keeps its own art direction but consumes the same typography, color, motion, focus, and control rules. Static assertions protect copy and semantics, while Playwright verifies responsive geometry, hit areas, reduced motion, and accessible names.

**Tech Stack:** Static HTML/CSS/JavaScript, Node test runner, Cheerio, Playwright, Vercel local preview.

**Spec:** `docs/superpowers/specs/2026-08-19-portfolio-recovery-migration-design.md`

## Global Constraints

- Canonical positioning: “Design engineer building AI-native products—from research and product design through working code.”
- Core fonts: Switzer for display/body and Geist Mono for metadata/interface text.
- Core colors: ink `#16202B`, white `#FFFFFF`, cool surface `#F4F7FC`, sun `#FFC93C`, accessible blue `#2F6CB8`.
- Motion durations: fast `160ms`, standard `260ms`, expressive `500ms`.
- Minimum interactive hit area: 44 by 44 CSS pixels.
- Preserve comprehensive `prefers-reduced-motion` behavior.
- Keep product-demo fonts scoped to their demonstrations.
- Do not redesign the illustration, sky, bees, or case-study narrative.

---

### Task 1: Establish shared design tokens

**Files:**
- Modify: `mockups/tokens.css`
- Modify: `mockups/nav.css`
- Modify: `mockups/buttons.css`
- Modify: `mockups/footer.css`
- Create: `tests/design-tokens.test.mjs`

**Interfaces:**
- Produces CSS custom properties `--font-display`, `--font-mono`, `--ink`, `--surface`, `--sun`, `--link`, `--motion-fast`, `--motion-standard`, `--motion-expressive`, `--ease-standard`, `--ease-expressive`, and `--hit-target`.

- [ ] **Step 1: Write failing token tests**

```js
// tests/design-tokens.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('defines the shared visual and motion tokens', async () => {
  const css = await readFile('mockups/tokens.css', 'utf8');
  for (const declaration of [
    '--font-display: Switzer, system-ui, sans-serif',
    '--font-mono: "Geist Mono", ui-monospace, Menlo, "SF Mono", monospace',
    '--ink: #16202b', '--surface: #f4f7fc', '--sun: #ffc93c', '--link: #2f6cb8',
    '--motion-fast: 160ms', '--motion-standard: 260ms', '--motion-expressive: 500ms', '--hit-target: 44px',
  ]) assert.ok(css.toLowerCase().includes(declaration.toLowerCase()), declaration);
});

test('shared controls do not use Arial or transition all', async () => {
  const css = await Promise.all(['mockups/nav.css', 'mockups/buttons.css', 'mockups/footer.css'].map((file) => readFile(file, 'utf8')));
  assert.doesNotMatch(css.join('\n'), /font-family\s*:\s*Arial/i);
  assert.doesNotMatch(css.join('\n'), /transition\s*:\s*all(?:\s|;)/i);
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `node --test tests/design-tokens.test.mjs`

Expected: FAIL because the exact shared tokens are absent and shared controls still contain local timing/font declarations.

- [ ] **Step 3: Add tokens and migrate only shared components**

Add the exact custom properties under `:root`. Replace touched shared-component font, color, radius, focus, and transition values with tokens. Replace `transition: all` with explicit `color`, `background-color`, `border-color`, `box-shadow`, `opacity`, and `transform` properties as appropriate.

- [ ] **Step 4: Run the token tests**

Run: `npm test -- tests/design-tokens.test.mjs`

Expected: both tests PASS.

- [ ] **Step 5: Commit shared tokens**

```bash
git add mockups/tokens.css mockups/nav.css mockups/buttons.css mockups/footer.css tests/design-tokens.test.mjs
git commit -m "Unify portfolio design tokens"
```

### Task 2: Correct positioning, statistics, and global language

**Files:**
- Modify: `mockups/meadow-ship.html`
- Modify: `mockups/beyond.html`
- Modify: `mockups/work.html`
- Modify: `mockups/blog.html`
- Modify: `mockups/footer.js`
- Modify: `mockups/nav-menu.js`
- Create: `tests/content-consistency.test.mjs`

**Interfaces:**
- Produces canonical positioning copy in page metadata and visible introductory copy.
- Produces final HTML statistics `6`, `3`, `15+`, and `$71M` before JavaScript runs.
- Produces canonical labels `work`, `about`, `art lab`, `writing`, `résumé ↓`, `quick view →`, `let’s talk →`.

- [ ] **Step 1: Write failing content-consistency tests**

```js
// tests/content-consistency.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const core = ['mockups/meadow-ship.html', 'mockups/work.html', 'mockups/beyond.html', 'mockups/blog.html'];

test('uses canonical global navigation language', async () => {
  for (const file of core) {
    const html = await readFile(file, 'utf8');
    for (const label of ['work', 'about', 'art lab']) assert.ok(html.toLowerCase().includes(label), `${file}: ${label}`);
    assert.doesNotMatch(html, />\s*lil(?:&nbsp;|\s)+about(?:&nbsp;|\s)+me\s*</i);
  }
});

test('ships final credibility values in initial HTML', async () => {
  const html = await readFile('mockups/meadow-ship.html', 'utf8');
  for (const value of ['6 YEARS.', '3 COUNTRIES.', '15+ PROJECTS.', '$71M IN REVENUE.']) assert.ok(html.includes(value), value);
  assert.doesNotMatch(html, />\s*0 YEARS\./);
});

test('uses one canonical positioning statement', async () => {
  const canonical = 'Design engineer building AI-native products—from research and product design through working code.';
  for (const file of ['mockups/meadow-ship.html', 'mockups/beyond.html']) {
    assert.ok((await readFile(file, 'utf8')).includes(canonical), file);
  }
});
```

- [ ] **Step 2: Verify all three tests fail**

Run: `node --test tests/content-consistency.test.mjs`

Expected: FAIL on legacy labels, initial zero counters, and inconsistent positioning.

- [ ] **Step 3: Implement canonical content and accessible counters**

Put final values in the semantic statistic text. If count-up motion remains, wrap a separate animated value with `aria-hidden="true"` and keep the final value in a visually identical, nonanimated accessible node. Update the counter script to start from zero only in the `aria-hidden` visual node.

- [ ] **Step 4: Run content and baseline tests**

Run: `npm test -- tests/content-consistency.test.mjs tests/recovered-routes.test.mjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit content consistency**

```bash
git add mockups/meadow-ship.html mockups/beyond.html mockups/work.html mockups/blog.html mockups/footer.js mockups/nav-menu.js tests/content-consistency.test.mjs
git commit -m "Unify portfolio positioning and navigation language"
```

### Task 3: Repair semantic structure and accessible names

**Files:**
- Modify: `mockups/meadow-ship.html`
- Modify: `mockups/beyond.html`
- Modify: `mockups/lab.html`
- Modify: `mockups/blog.html`
- Modify: `mockups/case-googlehealth.html`
- Modify: `mockups/nav.js`
- Create: `tests/semantics.test.mjs`

**Interfaces:**
- Produces exactly one visible H1 per core page.
- Produces one `main` landmark and no more than one semantic `footer` per core page.
- Produces nonempty accessible names for links, buttons, inputs, and range controls.

- [ ] **Step 1: Write failing semantic tests with Cheerio**

```js
// tests/semantics.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';

for (const file of ['mockups/meadow-ship.html', 'mockups/beyond.html', 'mockups/lab.html', 'mockups/blog.html', 'mockups/case-googlehealth.html']) {
  test(`${file} has coherent landmarks and names`, async () => {
    const $ = cheerio.load(await readFile(file, 'utf8'));
    assert.equal($('h1').length, 1, 'one H1');
    assert.equal($('main').length, 1, 'one main');
    assert.ok($('footer').length <= 1, 'at most one footer');
    $('a,button,input,textarea,select,[role="button"]').each((_, element) => {
      const node = $(element);
      const name = `${node.text()} ${node.attr('aria-label') ?? ''} ${node.attr('title') ?? ''}`.trim();
      assert.ok(name, `${element.tagName} is unnamed`);
    });
  });
}
```

- [ ] **Step 2: Run the semantic tests and verify failure**

Run: `node --test tests/semantics.test.mjs`

Expected: FAIL for About's missing H1, missing/inconsistent landmarks, and unnamed shared navigation/range controls.

- [ ] **Step 3: Repair semantics without visual changes**

Convert About's primary introductory heading to H1. Wrap page content in one `main`. Convert duplicate or decorative footer containers to `div`. Add `aria-label` to icon-only controls and the scene range control. For overlay links that duplicate a named card link, add the card title as `aria-label`; remove duplicate links from keyboard order only when an equivalent named control exists in the same component.

- [ ] **Step 4: Run semantic and browser tests**

Run: `npm test -- tests/semantics.test.mjs`

Run: `npm run test:e2e -- tests/baseline-routes.spec.mjs`

Expected: semantic tests PASS and visual routes still render.

- [ ] **Step 5: Commit semantic repairs**

```bash
git add mockups/meadow-ship.html mockups/beyond.html mockups/lab.html mockups/blog.html mockups/case-googlehealth.html mockups/nav.js tests/semantics.test.mjs
git commit -m "Repair portfolio semantics and accessible names"
```

### Task 4: Enforce mobile hit areas and About containment

**Files:**
- Modify: `mockups/beyond.html`
- Modify: `mockups/responsive.css`
- Modify: `mockups/buttons.css`
- Create: `tests/mobile-controls.spec.mjs`

**Interfaces:**
- Produces mobile carousel media with `right <= viewport width`.
- Produces minimum 44 by 44 hit areas for testimonial dots, view toggles, chat controls, and icon buttons.

- [ ] **Step 1: Write failing mobile geometry tests**

```js
// tests/mobile-controls.spec.mjs
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('About media and captions stay inside the viewport', async ({ page }) => {
  await page.goto('/beyond.html');
  const overflow = await page.locator('.cf img, .cf video, .cf .t, .cf .s').evaluateAll((nodes) =>
    nodes.filter((node) => node.getBoundingClientRect().right > document.documentElement.clientWidth + 1).length);
  expect(overflow).toBe(0);
});

test('small controls have a 44px hit area', async ({ page }) => {
  await page.goto('/beyond.html');
  for (const box of await page.locator('button[aria-label^="show quote"], .gnav-burger').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()))) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});
```

- [ ] **Step 2: Verify the mobile tests fail**

Run: `npm run test:e2e -- tests/mobile-controls.spec.mjs`

Expected: FAIL for About media right edges above 390px and 8–34px control boxes.

- [ ] **Step 3: Add containment and invisible hit-area padding**

At the mobile breakpoint, constrain `.cf`, media, and captions with `max-inline-size: 100%`, `box-sizing: border-box`, and transforms based on container width rather than fixed pixel offsets. Keep testimonial dots visually 8–10px using a pseudo-element inside a 44px button. Apply `min-inline-size` and `min-block-size: var(--hit-target)` to shared icon/button controls.

- [ ] **Step 4: Run mobile and reduced-motion browser projects**

Run: `npm run test:e2e -- tests/mobile-controls.spec.mjs`

Expected: both tests PASS at 390 by 844.

- [ ] **Step 5: Commit mobile controls**

```bash
git add mockups/beyond.html mockups/responsive.css mockups/buttons.css tests/mobile-controls.spec.mjs
git commit -m "Fix mobile media containment and hit areas"
```

### Task 5: Make Google Health embeds responsive

**Files:**
- Modify: `mockups/case-googlehealth.html`
- Modify: `mockups/responsive.css`
- Create: `tests/google-health-embeds.spec.mjs`

**Interfaces:**
- Produces iframe width `<=` its containing block at 390px.
- Preserves desktop demonstration dimensions and full-screen links.

- [ ] **Step 1: Write the failing embed test**

```js
// tests/google-health-embeds.spec.mjs
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('Google Health embeds stay within their containing block', async ({ page }) => {
  await page.goto('/case-googlehealth.html');
  const frames = await page.locator('iframe').evaluateAll((nodes) => nodes.map((frame) => {
    const box = frame.getBoundingClientRect();
    const parent = frame.parentElement.getBoundingClientRect();
    return { left: box.left, right: box.right, parentLeft: parent.left, parentRight: parent.right };
  }));
  for (const frame of frames) {
    expect(frame.left).toBeGreaterThanOrEqual(frame.parentLeft - 1);
    expect(frame.right).toBeLessThanOrEqual(frame.parentRight + 1);
  }
});
```

- [ ] **Step 2: Verify the test fails at the observed geometry**

Run: `npm run test:e2e -- tests/google-health-embeds.spec.mjs`

Expected: FAIL with iframe right edge near 455px on a 390px viewport.

- [ ] **Step 3: Implement a responsive embed wrapper**

Wrap each iframe in `.case-embed`. Apply `inline-size: 100%`, `max-inline-size: 100%`, `margin-inline: auto`, and `overflow: clip` to the wrapper; apply `display: block`, `inline-size: 100%`, and `max-inline-size: 100%` to the iframe. Preserve the existing aspect ratio using `aspect-ratio` on the wrapper or iframe rather than a fixed mobile width.

- [ ] **Step 4: Run embed and core route tests**

Run: `npm run test:e2e -- tests/google-health-embeds.spec.mjs tests/baseline-routes.spec.mjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit the responsive embeds**

```bash
git add mockups/case-googlehealth.html mockups/responsive.css tests/google-health-embeds.spec.mjs
git commit -m "Make Google Health demos responsive"
```

### Task 6: Consolidate contrast, focus, and motion behavior

**Files:**
- Modify: `mockups/tokens.css`
- Modify: `mockups/transition.css`
- Modify: `mockups/cinematic.css`
- Modify: `mockups/assistant.css`
- Modify: `mockups/nav.css`
- Create: `tests/interaction-system.spec.mjs`

**Interfaces:**
- Produces visible `:focus-visible` outline using `--focus-ring`.
- Produces no normal text in `#8B95A3` or `#0083E7` on white.
- Produces reduced-motion computed animation duration `<= 0.01ms` for representative ambient and reveal elements.

- [ ] **Step 1: Write failing interaction-system tests**

```js
// tests/interaction-system.spec.mjs
import { test, expect } from '@playwright/test';

test('keyboard focus is visible on the global menu button', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus-visible');
  await expect(focused).toBeVisible();
  expect(await focused.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('suppresses representative ambient and reveal motion', async ({ page }) => {
    await page.goto('/');
    for (const duration of await page.locator('.bee-wing, .i-rays, .ai-rv').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationDuration))) {
      expect(['0s', '0.00001s']).toContain(duration);
    }
  });
});
```

- [ ] **Step 2: Verify the tests expose inconsistent focus or timing behavior**

Run: `npm run test:e2e -- tests/interaction-system.spec.mjs`

Expected: at least the focus test fails before shared focus rules are applied.

- [ ] **Step 3: Implement the shared interaction system**

Add a two-layer high-contrast focus ring that works on light and dark surfaces. Replace normal text using `#8B95A3` on white with `#4E5F74` or darker, and replace `#0083E7` normal text on white with `#2F6CB8`; retain bright blue for large text, fills, or non-text accents. Migrate touched transitions to the three duration tokens and two shared easings. Keep existing reduced-motion selectors and the global `0.01ms` fallback.

- [ ] **Step 4: Run all static and browser tests**

Run: `npm test && npm run test:e2e`

Expected: all tests PASS with zero page errors.

- [ ] **Step 5: Capture before/after review images**

Capture desktop and 390px mobile screenshots of `/`, `/work.html`, `/beyond.html`, `/lab`, `/blog.html`, and `/case-googlehealth.html`. Confirm the sky, bees, illustrated environment, case narratives, and product-demo identities are preserved.

- [ ] **Step 6: Commit interaction-system changes**

```bash
git add mockups/tokens.css mockups/transition.css mockups/cinematic.css mockups/assistant.css mockups/nav.css tests/interaction-system.spec.mjs
git commit -m "Standardize portfolio contrast focus and motion"
```

