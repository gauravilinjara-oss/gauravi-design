# Satoshi Editorial Case Studies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Satoshi across gauravi.design and migrate all six case studies to one Bridgeway-inspired editorial shell while preserving project-specific artifacts and interactions.

**Architecture:** Keep the current static HTML architecture. Change the global font tokens once, add one shared `case-editorial.css` layer after page-local styles, and evolve the existing sidebar script into a responsive table of contents. Migrate the six case-study pages in two reviewable groups, retaining project modules as scoped content islands.

**Tech Stack:** Static HTML, CSS custom properties, vanilla JavaScript, Node.js test runner, Cheerio, Playwright, Vercel.

**Spec:** `docs/plans/2026-08-19-case-study-editorial-system-design.md`

## Global Constraints

- Satoshi is the portfolio typeface for navigation, headings, body copy, labels, captions, buttons, metadata, and case-study navigation.
- Use Satoshi 400 for body copy and large editorial titles, 500 for headings/navigation/controls, and 600 only for limited emphasis and important metrics.
- Preserve product-native typography only inside faithful product prototypes where the typeface is part of the demonstrated design; the Google Health Material prototype may retain Roboto Flex.
- Preserve every project-specific demo, screenshot, evidence block, meaningful interaction, and honest outcome claim.
- Use a warm white canvas, charcoal primary text, a reduced gray palette, thin neutral dividers, and one restrained accent per project.
- Desktop uses a fixed left rail; mobile uses a compact case-study section navigator without reducing content width.
- Motion must be restrained and must respect `prefers-reduced-motion`.
- Do not migrate the site to a new framework.
- Review a Vercel preview before promoting the redesign to `gauravi.design`.

## File Structure

- `mockups/tokens.css` — global Satoshi import, font tokens, type scale, palette, and shared motion values.
- `mockups/case-editorial.css` — case-study-only layout, editorial hierarchy, metadata, figures, content modules, responsive rules, and restrained reveal behavior.
- `mockups/case-sidebar.css` — desktop rail and mobile table-of-contents presentation only.
- `mockups/case-sidebar.js` — derives section navigation, manages scroll state/progress, and creates the mobile navigator.
- `mockups/case-*.html` — page content, explicit section labels/anchors, project accent value, and links to shared case-study assets.
- `mockups/*.html`, `mockups/*.css`, `assets/case/*.css` — mechanical removal of legacy portfolio font declarations; product-native Roboto declarations remain scoped.
- `tests/design-tokens.test.mjs` — global font-token and legacy-family regression checks.
- `tests/case-study-system.test.mjs` — static structural contract for all six case studies.
- `tests/case-study-system.spec.mjs` — desktop/mobile, scroll-spy, font, overflow, and reduced-motion browser verification.

---

### Task 1: Replace the global portfolio font system with Satoshi

**Files:**
- Modify: `mockups/tokens.css:1-120`
- Modify: `mockups/*.html` legacy portfolio font declarations
- Modify: `mockups/*.css` legacy portfolio font declarations
- Modify: `assets/case/case-bo-ix.css`
- Modify: `assets/case/case-fx-ix.css`
- Modify: `assets/case/case-st-ix.css`
- Modify: `tests/design-tokens.test.mjs`

**Interfaces:**
- Consumes: Fontshare's official Satoshi CSS API.
- Produces: `--font-display`, `--font-text`, `--font-accent`, `--font-mono`, and all legacy `--t-font-*` aliases resolving to `Satoshi, system-ui, sans-serif`.

- [ ] **Step 1: Change the token test so it requires Satoshi and rejects legacy portfolio families**

```js
import { readdir, readFile } from 'node:fs/promises';

test('uses Satoshi as the single portfolio family', async () => {
  const css = await readFile('mockups/tokens.css', 'utf8');
  for (const declaration of [
    '--font-display: Satoshi, system-ui, sans-serif',
    '--font-text: Satoshi, system-ui, sans-serif',
    '--font-accent: Satoshi, system-ui, sans-serif',
    '--font-mono: Satoshi, system-ui, sans-serif',
  ]) assert.ok(css.includes(declaration), declaration);

  const files = (await readdir('mockups'))
    .filter((name) => /\.(?:css|html)$/.test(name));
  const source = (await Promise.all([
    ...files.map((name) => `mockups/${name}`),
    'assets/case/case-bo-ix.css',
    'assets/case/case-fx-ix.css',
    'assets/case/case-st-ix.css',
  ].map((path) => readFile(path, 'utf8')))).join('\n');
  assert.doesNotMatch(source, /font-family\s*:[^;}]*\b(?:Switzer|Geist Mono|Fraunces|Archivo)\b/i);
});
```

- [ ] **Step 2: Run the focused test and verify the current font system fails it**

Run: `node --test tests/design-tokens.test.mjs`

Expected: FAIL because `tokens.css` still imports Switzer/Geist Mono and legacy declarations remain.

- [ ] **Step 3: Replace the imports and canonical/legacy font tokens**

At the top of `mockups/tokens.css`, use the official API and collapse every portfolio typography token onto Satoshi:

```css
@import url("https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600&display=swap");

:root{
  --font-display:Satoshi,system-ui,sans-serif;
  --font-text:Satoshi,system-ui,sans-serif;
  --font-accent:Satoshi,system-ui,sans-serif;
  --font-mono:Satoshi,system-ui,sans-serif;
  --t-font-sans:Satoshi,system-ui,sans-serif;
  --t-font-display:Satoshi,system-ui,sans-serif;
  --t-font-serif:Satoshi,system-ui,sans-serif;
  --t-font-hand:Satoshi,system-ui,sans-serif;
  --t-font-mono:Satoshi,system-ui,sans-serif;
}
```

Update the existing canonical `:root` block rather than adding a second competing block. Replace portfolio-level `Switzer`, `Geist Mono`, `Fraunces`, and `Archivo` declarations throughout `mockups/` and `assets/case/*.css` with `Satoshi`. Leave `Roboto Flex` and `Material Symbols Rounded` only in the scoped Google Health prototype classes (`.mat`, `.m3`, `.ms`, and their descendants).

- [ ] **Step 4: Normalize typography rules for a single-family hierarchy**

```css
body{font-family:var(--font-text);font-weight:400}
h1{font-family:var(--font-display);font-weight:400;letter-spacing:-.035em}
h2,h3,h4{font-family:var(--font-display);font-weight:500}
.eyebrow,.navmeta,.note,figcaption{font-family:var(--font-text);font-weight:500}
```

Remove forced lowercase rules from shared heading selectors. Keep deliberate casing in the actual HTML copy.

- [ ] **Step 5: Run the focused and full static test suites**

Run: `node --test tests/design-tokens.test.mjs`

Expected: PASS.

Run: `npm test`

Expected: all static tests PASS.

- [ ] **Step 6: Commit the global typography migration**

```bash
git add mockups assets/case tests/design-tokens.test.mjs
git commit -m "style: adopt Satoshi across portfolio"
```

---

### Task 2: Build the shared editorial case-study layer

**Files:**
- Create: `mockups/case-editorial.css`
- Create: `tests/case-study-system.test.mjs`
- Modify: `mockups/case-podonos.html`
- Modify: `mockups/case-fxonline.html`
- Modify: `mockups/case-smarttrade.html`
- Modify: `mockups/case-business.html`
- Modify: `mockups/case-mashreq.html`
- Modify: `mockups/case-googlehealth.html`

**Interfaces:**
- Consumes: global tokens from `mockups/tokens.css`; `<body class="case-study">`; per-page `--case-accent`; existing `.wrap`, `.hero`, `.sec-head`, `.eyebrow`, `.snap-card`, `.visual`, `.quote`, `.impact`, `.handoff`, and `figure` structures.
- Produces: consistent `.case-study` layout and component styling, with project modules remaining locally scoped.

- [ ] **Step 1: Write the static contract for all six pages**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';

const cases = [
  'case-podonos.html', 'case-fxonline.html', 'case-smarttrade.html',
  'case-business.html', 'case-mashreq.html', 'case-googlehealth.html',
];

for (const name of cases) {
  test(`${name} uses the shared editorial shell`, async () => {
    const html = await readFile(`mockups/${name}`, 'utf8');
    const $ = cheerio.load(html);
    assert.ok($('body').hasClass('case-study'), 'case-study body class');
    assert.equal($('link[href^="case-editorial.css"]').length, 1, 'editorial stylesheet');
    assert.equal($('header.hero[data-nav-label="Overview"]').length, 1, 'one editorial introduction');
    assert.ok($('section .sec-head').length >= 6, 'narrative chapters');
    assert.ok($('[data-case-accent]').length === 1, 'one project accent hook');
    assert.equal(new Set($('section[id]').map((_, el) => $(el).attr('id')).get()).size,
      $('section[id]').length, 'unique section ids');
  });
}
```

- [ ] **Step 2: Run the contract and verify all six pages fail**

Run: `node --test tests/case-study-system.test.mjs`

Expected: FAIL because the new body hook, accent hook, and stylesheet do not exist.

- [ ] **Step 3: Create the editorial stylesheet with the approved shell tokens**

Start `mockups/case-editorial.css` with these exact shared foundations:

```css
.case-study{
  --case-canvas:#fcfcfa;
  --case-sidebar:#f3f2ed;
  --case-ink:#25282d;
  --case-soft:#666c74;
  --case-faint:#8b9097;
  --case-rule:rgba(37,40,45,.12);
  --case-accent:var(--accent);
  --case-prose:720px;
  --case-media:1040px;
  --case-rail:236px;
  background:var(--case-canvas)!important;
  color:var(--case-ink);
  font-family:var(--font-text);
}
.case-study main{margin-left:var(--case-rail)}
.case-study .wrap{width:min(var(--case-media),calc(100% - 80px));margin-inline:auto}
.case-study header.hero{padding-block:clamp(88px,11vw,152px) clamp(64px,9vw,112px)}
.case-study header.hero h1{
  max-width:900px;margin:16px 0 24px;font-size:clamp(48px,6.2vw,82px);
  line-height:.98;letter-spacing:-.045em;font-weight:400;text-transform:none;
}
.case-study .sec-head{max-width:var(--case-prose);margin-bottom:clamp(32px,4vw,56px)}
.case-study .sec-head h2{
  font-size:clamp(36px,4.6vw,62px);line-height:1.02;
  letter-spacing:-.04em;font-weight:500;text-transform:none;
}
.case-study .eyebrow{
  color:var(--case-faint);font-size:11px;font-weight:500;
  letter-spacing:.14em;line-height:1.4;text-transform:uppercase;
}
.case-study section{padding-block:clamp(72px,9vw,128px);border-color:var(--case-rule)}
.case-study p{max-width:68ch;color:var(--case-soft);font-size:17px;line-height:1.7}
.case-study figure,.case-study .visual{margin-block:clamp(36px,5vw,72px)}
.case-study figcaption{margin-top:12px;color:var(--case-faint);font-size:12px;line-height:1.5}
.case-study .snap-card,.case-study .meta-grid{
  border-block:1px solid var(--case-rule);border-radius:0;background:transparent;box-shadow:none;
}
.case-study .card,.case-study .voice,.case-study .imp{
  border:1px solid var(--case-rule);background:#fff;box-shadow:none;
}
@media(max-width:1179px){
  .case-study main{margin-left:0}
  .case-study .wrap{width:min(100% - 40px,var(--case-media))}
}
@media(max-width:680px){
  .case-study .wrap{width:min(100% - 32px,var(--case-media))}
  .case-study header.hero{padding-block:72px 56px}
  .case-study header.hero h1{font-size:clamp(42px,13vw,58px)}
  .case-study section{padding-block:64px}
}
```

Add these shared module rules after the foundations. They remove gradients, glass, and hover elevation from the editorial shell without targeting project-prefixed demo classes such as `.fxj`, `.boj`, `.ghj`, `.cc`, `.mat`, or `.m3`:

```css
.case-study .section-lede{font-size:clamp(19px,2vw,24px);line-height:1.55;color:var(--case-soft)}
.case-study .quote{max-width:780px;margin-inline:auto;padding:0;background:transparent;border:0;box-shadow:none}
.case-study .quote .q{font-size:clamp(28px,3.2vw,42px);line-height:1.25;font-weight:400;color:var(--case-ink)}
.case-study .impact-sky{padding:0;background:transparent;border-radius:0}
.case-study .impact{gap:20px}
.case-study .handoff{padding-block:0;background:transparent;color:var(--case-ink)}
.case-study .nextcase{border-top:1px solid var(--case-rule)}
.case-study .nextcase .t{font-size:clamp(30px,4vw,54px);font-weight:500;text-transform:none}
```

- [ ] **Step 4: Wire the stylesheet and body/accent hooks into every case page**

For every case page, set:

```html
<body class="case-study" data-cine="hero parallax grain" data-case-accent>
```

Preserve any pre-existing body classes and data attributes. Load the new shared layer after existing page-local and responsive styles, immediately before `case-sidebar.css`:

```html
<link rel="stylesheet" href="case-editorial.css?v=1">
<link rel="stylesheet" href="case-sidebar.css?v=editorial1">
```

Set `--case-accent` in each page's existing `:root`: Podonos `#3268d8`, FX Online `#8a5a2b`, smartTRADE `#2e6a55`, Business Online `#a14f38`, Mashreq `#9a3f54`, and Google Health `#57751f`. Keep these accents out of body-copy color.

Add `data-nav-label="Overview"` to each existing `<header class="hero">`.

- [ ] **Step 5: Run the structural and full static suites**

Run: `node --test tests/case-study-system.test.mjs`

Expected: all six cases PASS.

Run: `npm test`

Expected: all static tests PASS.

- [ ] **Step 6: Commit the shared editorial shell**

```bash
git add mockups/case-editorial.css mockups/case-*.html tests/case-study-system.test.mjs
git commit -m "feat: add shared editorial case study shell"
```

---

### Task 3: Make the case-study table of contents responsive and accessible

**Files:**
- Modify: `mockups/case-sidebar.js`
- Modify: `mockups/case-sidebar.css`
- Create: `tests/case-study-system.spec.mjs`

**Interfaces:**
- Consumes: `header.hero`, `section[id]`, `.sec-head .eyebrow`, optional `data-nav-label`, and optional `data-nav-number`.
- Produces: desktop `#caserail`, mobile `#caseMobileNav`, `aria-current="location"`, URL hash updates, reading progress, and reduced-motion-aware anchor navigation.

- [ ] **Step 1: Write browser tests for the desktop rail and mobile navigator**

```js
import { test, expect } from '@playwright/test';

const cases = [
  '/case-podonos.html', '/case-fxonline.html', '/case-smarttrade.html',
  '/case-business.html', '/case-mashreq.html', '/case-googlehealth.html',
];

for (const path of cases) {
  test(`${path} exposes the editorial navigation`, async ({ page }, testInfo) => {
    await page.goto(path);
    await expect(page.locator('body')).toHaveCSS('font-family', /Satoshi/);
    if (testInfo.project.name.startsWith('desktop')) {
      await expect(page.locator('#caserail')).toBeVisible();
      await expect(page.locator('#caserail nav a')).toHaveCount(
        await page.locator('header.hero, section:has(.sec-head .eyebrow)').count());
    } else {
      await expect(page.locator('#caserail')).toBeHidden();
      await expect(page.locator('#caseMobileNav')).toBeVisible();
    }
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
```

- [ ] **Step 2: Run the browser test and verify mobile fails**

Run: `npx playwright test tests/case-study-system.spec.mjs`

Expected: desktop rail assertions pass or expose existing label-count issues; mobile tests FAIL because `#caseMobileNav` does not exist.

- [ ] **Step 3: Refactor navigation data extraction into explicit functions**

Use this interface inside `case-sidebar.js`:

```js
function getSectionEntries(){
  const entries=[];
  const hero=document.querySelector('header.hero');
  if(hero){
    hero.id ||= 'overview';
    entries.push({el:hero,num:'',label:hero.dataset.navLabel || 'Overview'});
  }
  document.querySelectorAll('section').forEach((section,index)=>{
    const eyebrow=section.querySelector('.sec-head .eyebrow');
    if(!eyebrow) return;
    const match=eyebrow.textContent.trim().match(/^(\d+)\s*·\s*(.+)$/);
    section.id ||= `chapter-${index + 1}`;
    entries.push({
      el:section,
      num:section.dataset.navNumber || match?.[1] || '',
      label:section.dataset.navLabel || match?.[2] || eyebrow.textContent.trim(),
    });
  });
  return entries;
}

function scrollToEntry(entry){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  entry.el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  history.replaceState(null,'',`#${entry.el.id}`);
}
```

Keep the existing HTML escaping helper and metadata extraction. Use `aria-current="location"` for the active entry.

- [ ] **Step 4: Create a mobile select-based section navigator**

```js
function buildMobileNav(entries){
  const holder=document.createElement('div');
  holder.id='caseMobileNav';
  holder.innerHTML='<label for="caseSectionSelect">In this case study</label><select id="caseSectionSelect" aria-label="Jump to a section"></select>';
  const select=holder.querySelector('select');
  entries.forEach((entry,index)=>{
    select.add(new Option(`${entry.num ? `${entry.num} · ` : ''}${entry.label}`,String(index)));
  });
  select.addEventListener('change',()=>scrollToEntry(entries[Number(select.value)]));
  document.querySelector('main')?.before(holder);
  return {holder,select};
}
```

Update the select whenever the IntersectionObserver changes the active section.

- [ ] **Step 5: Reduce `case-sidebar.css` to navigation presentation and add mobile rules**

```css
#caserail{background:var(--case-sidebar);width:var(--case-rail);border-right:1px solid var(--case-rule)}
#caserail .cr-proj,#caserail .cr-fact,#caserail .cr-navlabel,#caserail .cr-nav a,#caserail .cr-pct{
  font-family:var(--font-text);text-transform:none;
}
#caseMobileNav{display:none}
@media(min-width:1180px){#caserail{display:flex}}
@media(max-width:1179px){
  #caseMobileNav{display:flex;position:sticky;top:0;z-index:54;align-items:center;gap:12px;
    padding:10px 20px;background:rgba(252,252,250,.94);border-bottom:1px solid var(--case-rule);
    backdrop-filter:blur(12px)}
  #caseMobileNav label{font-size:12px;font-weight:500;color:var(--case-soft)}
  #caseMobileNav select{min-height:44px;min-width:0;flex:1;font:500 14px/1 var(--font-text);
    color:var(--case-ink);background:#fff;border:1px solid var(--case-rule);border-radius:10px;padding:0 36px 0 12px}
}
```

Move all quote, impact, findings, stepper, reflection, and card rules that currently live in `case-sidebar.css` into `case-editorial.css`; leave only `#caserail`, `.cr-*`, `#caseMobileNav`, and their media queries in the sidebar file.

- [ ] **Step 6: Run browser and static tests**

Run: `npx playwright test tests/case-study-system.spec.mjs`

Expected: PASS in desktop and mobile Chromium.

Run: `npm test`

Expected: PASS.

- [ ] **Step 7: Commit the responsive navigation**

```bash
git add mockups/case-sidebar.css mockups/case-sidebar.js mockups/case-editorial.css tests/case-study-system.spec.mjs
git commit -m "feat: add responsive case study navigation"
```

---

### Task 4: Normalize Podonos, FX Online, and smartTRADE chapters

**Files:**
- Modify: `mockups/case-podonos.html`
- Modify: `mockups/case-fxonline.html`
- Modify: `mockups/case-smarttrade.html`
- Modify: `tests/case-study-system.test.mjs`

**Interfaces:**
- Consumes: the shared editorial shell and navigation `data-nav-label` contract.
- Produces: stable chapter anchors and concise sidebar labels while retaining all project-specific demos.

- [ ] **Step 1: Extend the static test with required narrative landmarks**

```js
const requiredLabels = {
  'case-podonos.html': ['Overview','Context','Problem','Research','Design','Solution','Build','Impact','Reflection'],
  'case-fxonline.html': ['Overview','Context','Problem','Research','Strategy','Solution','Flow','Impact','Reflection'],
  'case-smarttrade.html': ['Overview','Context','Problem','Research','Strategy','Solution','Flow','Impact','Reflection'],
};

for (const [name,labels] of Object.entries(requiredLabels)) {
  test(`${name} has the editorial narrative`, async () => {
    const $=cheerio.load(await readFile(`mockups/${name}`,'utf8'));
    const actual=$('[data-nav-label]').map((_,el)=>$(el).attr('data-nav-label')).get();
    for (const label of labels) assert.ok(actual.includes(label), `${name}: ${label}`);
  });
}
```

- [ ] **Step 2: Run the test and verify the explicit labels fail**

Run: `node --test tests/case-study-system.test.mjs`

Expected: FAIL because the current sections rely on eyebrow text inference.

- [ ] **Step 3: Add stable ids and labels to Podonos**

Map the existing sections without removing content:

```html
<header class="hero" id="overview" data-nav-label="Overview">
<section id="context" data-nav-label="Context">
<section id="problem" data-nav-label="Problem">
<section id="research" data-nav-label="Research">
<section id="design" data-nav-label="Design">
<section id="solution" data-nav-label="Solution">
<section id="build" data-nav-label="Build">
<section id="impact" data-nav-label="Impact">
<section id="reflection" data-nav-label="Reflection">
```

Apply the listed opening-tag attributes to the existing hero/sections; do not add new wrapper elements. Give the existing strategic-shift section `id="strategy" data-nav-label="Strategy"`. Keep the NDA gate and OnePin interactions unchanged.

- [ ] **Step 4: Add stable ids and labels to FX Online**

Keep the hero at `id="overview" data-nav-label="Overview"`. Give the existing chapters the ids `context`, `problem`, `strategy`, `research`, `solution`, `flow`, `decisions`, `screens`, `impact`, and `reflection`, with title-cased `data-nav-label` values. Preserve `.fxj`, rate timer, browser frames, video assets, and all financial-workflow evidence.

- [ ] **Step 5: Add stable ids and labels to smartTRADE**

Keep the hero at `id="overview" data-nav-label="Overview"`. Give the existing chapters the ids `context`, `problem`, `strategy`, `research`, `solution`, `flow`, `decisions`, `screens`, `impact`, `recognition`, and `reflection`, with title-cased `data-nav-label` values. Preserve `.stj`, discrepancy/status media, award evidence, and trade-finance screens.

- [ ] **Step 6: Apply editorial pacing without rewriting claims**

For these three files:

```html
<div class="sec-head">
  <span class="eyebrow">04 · Research</span>
  <h2>Existing project-specific headline</h2>
  <p class="section-lede">Existing introductory explanation, limited to the clearest one or two paragraphs.</p>
</div>
```

Move redundant introductory copy after the first artifact rather than deleting it. Wrap media plus captions in `<figure>`/`<figcaption>` only where the current source already provides the factual caption text.

- [ ] **Step 7: Run static and focused browser tests**

Run: `node --test tests/case-study-system.test.mjs`

Expected: PASS.

Run: `npx playwright test tests/case-study-system.spec.mjs --grep "podonos|fxonline|smarttrade"`

Expected: PASS on desktop and mobile.

- [ ] **Step 8: Commit the first migration group**

```bash
git add mockups/case-podonos.html mockups/case-fxonline.html mockups/case-smarttrade.html tests/case-study-system.test.mjs
git commit -m "style: migrate first case studies to editorial format"
```

---

### Task 5: Normalize Business Online, Mashreq, and Google Health chapters

**Files:**
- Modify: `mockups/case-business.html`
- Modify: `mockups/case-mashreq.html`
- Modify: `mockups/case-googlehealth.html`
- Modify: `tests/case-study-system.test.mjs`

**Interfaces:**
- Consumes: shared editorial shell, responsive navigation contract, and Google Health's scoped native-type exception.
- Produces: the remaining three case studies on the same explicit narrative contract.

- [ ] **Step 1: Add required labels for the second group to the static test**

```js
Object.assign(requiredLabels, {
  'case-business.html': ['Overview','Context','People','Problem','Research','Strategy','Solution','Trust','Onboarding','Impact','Reflection'],
  'case-mashreq.html': ['Overview','Context','Problem','Research','Competitive analysis','Strategy','Solution','Flow','Impact','Reflection'],
  'case-googlehealth.html': ['Overview','Context','Audit','Principles','Solution','System','Prototype','Testing','Reflection'],
});
```

- [ ] **Step 2: Run the test and verify the second group fails**

Run: `node --test tests/case-study-system.test.mjs`

Expected: FAIL on missing `data-nav-label` values for these three pages.

- [ ] **Step 3: Add stable ids and labels to Business Online**

Keep the hero at `id="overview" data-nav-label="Overview"`. Give the existing chapters the ids `context`, `people`, `problem`, `research`, `strategy`, `process`, `solution`, `trust`, `onboarding`, `impact`, and `reflection`, with title-cased `data-nav-label` values. Preserve `.boj`, maker/checker demonstrations, onboarding media, and organizational-impact evidence.

- [ ] **Step 4: Add stable ids and labels to Mashreq**

Keep the hero at `id="overview" data-nav-label="Overview"`. Give the existing chapters the ids `context`, `problem`, `research`, `competitive-analysis`, `strategy`, `solution`, `flow`, `impact`, and `reflection`, with title-cased `data-nav-label` values. Preserve `.cc`, `.hero-mq`, search behavior, shipped screenshots, and the live-product link.

- [ ] **Step 5: Add stable ids and labels to Google Health**

Keep the hero at `id="overview" data-nav-label="Overview"`. Give the existing chapters the ids `context`, `audit`, `principles`, `solution`, `system`, `prototype`, `testing`, and `reflection`, with title-cased `data-nav-label` values. Keep `Roboto Flex` and Material Symbols scoped inside `.mat`, `.m3`, and `.ms` prototype UI; ensure `.case-study` headings, prose, labels, navigation, and captions compute to Satoshi.

- [ ] **Step 6: Apply the same editorial pacing contract**

Add `.section-lede` to the first explanatory paragraph under each `.sec-head`; retain detailed evidence after the first visual. Do not create metrics, research findings, or claims that do not already exist in the page.

- [ ] **Step 7: Run static and focused browser tests**

Run: `node --test tests/case-study-system.test.mjs`

Expected: PASS.

Run: `npx playwright test tests/case-study-system.spec.mjs --grep "business|mashreq|googlehealth"`

Expected: PASS on desktop and mobile.

- [ ] **Step 8: Commit the second migration group**

```bash
git add mockups/case-business.html mockups/case-mashreq.html mockups/case-googlehealth.html tests/case-study-system.test.mjs
git commit -m "style: migrate remaining case studies to editorial format"
```

---

### Task 6: Standardize restrained motion and accessibility behavior

**Files:**
- Modify: `mockups/case-editorial.css`
- Modify: `mockups/cinematic.js`
- Modify: `tests/case-study-system.spec.mjs`

**Interfaces:**
- Consumes: existing `.rv`, `.reveal`, `.words`, `.shiftblk`, `[data-cine-*]`, and interactive project modules.
- Produces: one editorial reveal pattern, visible keyboard focus, accurate anchored headings, and reduced-motion-safe pages.

- [ ] **Step 1: Add reduced-motion and anchor-offset browser tests**

```js
test('case studies remain visible with reduced motion', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/case-googlehealth.html');
  const hidden = await page.locator('.rv,.reveal,.words .wcard,.shiftblk .new').evaluateAll((nodes) =>
    nodes.filter((node) => getComputedStyle(node).opacity === '0').length);
  expect(hidden).toBe(0);
});

test('anchored chapter is not hidden by sticky navigation', async ({ page }) => {
  await page.goto('/case-mashreq.html#research');
  const top = await page.locator('#research').evaluate((node) => node.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(0);
});
```

- [ ] **Step 2: Run the new tests and verify any current failures**

Run: `npx playwright test tests/case-study-system.spec.mjs --grep "reduced motion|anchored"`

Expected: at least the anchor-offset check fails until the shared rules are added.

- [ ] **Step 3: Add the restrained shared motion layer**

```css
.case-study .rv,.case-study .reveal{
  opacity:0;transform:translateY(18px);
  transition:opacity 600ms var(--ease-expressive),transform 600ms var(--ease-expressive);
}
.case-study .rv.in,.case-study .reveal.in{opacity:1;transform:none}
.case-study section[id]{scroll-margin-top:88px}
.case-study :focus-visible{outline:2px solid var(--focus-inner);box-shadow:0 0 0 5px var(--focus-ring)}
@media(prefers-reduced-motion:reduce){
  .case-study *{scroll-behavior:auto!important}
  .case-study .rv,.case-study .reveal,.case-study .words .wcard,
  .case-study .shiftblk .new,.case-study .shiftblk .arw,.case-study .shiftblk .ssub{
    opacity:1!important;transform:none!important;animation:none!important;transition:none!important;
  }
}
```

- [ ] **Step 4: Disable decorative cinematic behaviors on case pages**

In `cinematic.js`, prevent its existing tilt IIFE from running on case studies by adding `isCaseStudy` beside `reduce`/`coarse` and changing the existing tilt condition. The file already returns early for reduced motion:

```js
var isCaseStudy=body.classList.contains('case-study');
```

Replace the exact condition `if (has('tilt') && !coarse) (function () {` with `if (has('tilt') && !coarse && !isCaseStudy) (function () {`; leave the IIFE body and closing call intact.

- [ ] **Step 5: Run all browser tests**

Run: `npm run test:e2e`

Expected: all desktop and mobile Playwright projects PASS.

- [ ] **Step 6: Commit motion and accessibility refinements**

```bash
git add mockups/case-editorial.css mockups/cinematic.js tests/case-study-system.spec.mjs
git commit -m "fix: refine case study motion and accessibility"
```

---

### Task 7: Complete full regression and visual review

**Files:**
- Modify if failures require it: files changed in Tasks 1-6 only
- Generate untracked review images: `work/case-study-review/*.png`

**Interfaces:**
- Consumes: completed Satoshi and editorial migrations.
- Produces: a clean, reviewable Vercel preview candidate with desktop/mobile evidence.

- [ ] **Step 1: Run every static test**

Run: `npm test`

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Run every browser test**

Run: `npm run test:e2e`

Expected: all desktop and mobile projects PASS with zero failures.

- [ ] **Step 3: Run repository privacy and tracked-file checks**

Run: `npm run audit:privacy`

Expected: PASS with no secret or unsafe tracked-file findings.

- [ ] **Step 4: Capture a visual matrix from the local preview**

Capture full-page screenshots for all six case-study routes at `1440x1000` and `390x844`. Store them under `work/case-study-review/` and inspect:

- Satoshi is visibly loaded before approval.
- Sidebar and mobile navigator never cover content.
- Titles, chapter spacing, prose width, metadata, captions, and next-case links are consistent.
- Project modules retain their original brand colors and controls.
- No image, video, comparison slider, protected case gate, or prototype is clipped.
- No horizontal overflow appears at either viewport.

- [ ] **Step 5: Verify the production build candidate has no accidental diffs**

Run: `git status --short`

Expected: no uncommitted source changes; `work/` screenshots remain ignored or untracked outside the commit.

- [ ] **Step 6: Create a Vercel preview deployment**

Run: `npx vercel --yes`

Expected: Vercel returns a successful preview URL. Open the preview and repeat one desktop and one mobile smoke check on Podonos, Mashreq, and Google Health.

- [ ] **Step 7: Pause for visual approval before production promotion**

Share the preview URL and the desktop/mobile review result. Do not run a production deployment until Gauravi approves the preview.

- [ ] **Step 8: Promote the approved build and verify the custom domain**

After approval, run:

```bash
npx vercel --prod --yes
```

Expected: deployment succeeds and `https://gauravi.design` serves the approved Satoshi editorial build. Verify `/case-podonos.html`, `/case-mashreq.html`, and `/case-googlehealth.html` return successful responses and show the new shell.

- [ ] **Step 9: Record the production verification commit if any deployment-only metadata changed**

If Vercel changed no tracked files, do not create an empty commit. If tracked project metadata changed, inspect it, then run:

```bash
git add .vercel/project.json
git commit -m "chore: record Vercel project linkage"
```

Only add `.vercel/project.json` if it is already intentionally tracked and contains no credentials.
