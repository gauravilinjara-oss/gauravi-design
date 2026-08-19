# Portfolio Recovery Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recover the current production portfolio and its AI endpoint into a sanitized, reproducible local Git baseline without changing production.

**Architecture:** A deterministic Node recovery script downloads an explicit route allowlist from the live Vercel site, saves authored HTML under `mockups/`, and follows only same-origin production assets. The six serverless API files and minimal Vercel configuration are recovered separately from Vercel's retained source view, then static and browser tests prove the local baseline matches production behavior.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js 24, npm, Node test runner, Cheerio, Playwright, Vercel serverless functions, Anthropic SDK.

**Spec:** `docs/superpowers/specs/2026-08-19-portfolio-recovery-migration-design.md`

## Global Constraints

- Vercel project `n` remains untouched while the baseline is recovered.
- Never store API keys, Vercel tokens, cookies, browser data, or environment-variable values in files or Git.
- Exclude `.agents`, `.claude`, `.superpowers`, `Resumes`, `job-search`, `_fxcheck_tmp`, backup folders, FUSE artifacts, and unreferenced prototypes.
- Keep only production routes, referenced production assets, `api/chat.js`, `api/_prompt.js`, and API modules imported by production code.
- Preserve the current route contract from `vercel.json`.
- The first source commit must represent the live site before consistency changes.
- All production code changes follow red-green-refactor.

---

### Task 1: Define the recovery boundary

**Files:**
- Create: `.gitignore`
- Create: `scripts/recovery-manifest.mjs`
- Create: `tests/recovery-manifest.test.mjs`
- Create: `package.json`

**Interfaces:**
- Produces: `ROUTE_MAP: ReadonlyArray<{ urlPath: string, outputPath: string }>`
- Produces: `ALLOWED_ROOTS: ReadonlyArray<string>`
- Produces: `EXCLUDED_SEGMENTS: ReadonlyArray<string>`
- Produces: `isAllowedOutput(relativePath: string): boolean`

- [ ] **Step 1: Write the failing recovery-boundary tests**

```js
// tests/recovery-manifest.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROUTE_MAP,
  isAllowedOutput,
  EXCLUDED_SEGMENTS,
} from '../scripts/recovery-manifest.mjs';

test('maps every production route to an authored file', () => {
  const routes = new Map(ROUTE_MAP.map(({ urlPath, outputPath }) => [urlPath, outputPath]));
  assert.equal(routes.get('/'), 'mockups/meadow-ship.html');
  assert.equal(routes.get('/work.html'), 'mockups/work.html');
  assert.equal(routes.get('/beyond.html'), 'mockups/beyond.html');
  assert.equal(routes.get('/lab'), 'mockups/lab.html');
  assert.equal(routes.get('/blog.html'), 'mockups/blog.html');
  assert.equal(routes.get('/case-googlehealth.html'), 'mockups/case-googlehealth.html');
});

test('rejects private and temporary deployment paths', () => {
  for (const segment of EXCLUDED_SEGMENTS) {
    assert.equal(isAllowedOutput(`${segment}/private.txt`), false, segment);
  }
  assert.equal(isAllowedOutput('mockups/work.html'), true);
  assert.equal(isAllowedOutput('assets/images/work.webp'), true);
  assert.equal(isAllowedOutput('api/chat.js'), true);
});
```

- [ ] **Step 2: Run the tests and verify the expected failure**

Run: `node --test tests/recovery-manifest.test.mjs`

Expected: FAIL because `scripts/recovery-manifest.mjs` does not exist.

- [ ] **Step 3: Implement the manifest and ignore rules**

```js
// scripts/recovery-manifest.mjs
export const ROUTE_MAP = Object.freeze([
  { urlPath: '/', outputPath: 'mockups/meadow-ship.html' },
  { urlPath: '/work.html', outputPath: 'mockups/work.html' },
  { urlPath: '/beyond.html', outputPath: 'mockups/beyond.html' },
  { urlPath: '/lab', outputPath: 'mockups/lab.html' },
  { urlPath: '/blog.html', outputPath: 'mockups/blog.html' },
  { urlPath: '/quick.html', outputPath: 'mockups/quick.html' },
  { urlPath: '/case-podonos.html', outputPath: 'mockups/case-podonos.html' },
  { urlPath: '/case-fxonline.html', outputPath: 'mockups/case-fxonline.html' },
  { urlPath: '/case-smarttrade.html', outputPath: 'mockups/case-smarttrade.html' },
  { urlPath: '/case-business.html', outputPath: 'mockups/case-business.html' },
  { urlPath: '/case-mashreq.html', outputPath: 'mockups/case-mashreq.html' },
  { urlPath: '/case-googlehealth.html', outputPath: 'mockups/case-googlehealth.html' },
  { urlPath: '/bridging', outputPath: 'mockups/bridging.html' },
  { urlPath: '/artofmaking', outputPath: 'mockups/making.html' },
  { urlPath: '/site-info', outputPath: 'mockups/site-info.html' },
  { urlPath: '/health', outputPath: 'mockups/gh-redesign.html' },
]);

export const ALLOWED_ROOTS = Object.freeze(['api', 'assets', 'mockups', 'tests', 'scripts', 'docs']);
export const EXCLUDED_SEGMENTS = Object.freeze([
  '.agents', '.claude', '.superpowers', 'Resumes', 'job-search', '_fxcheck_tmp',
  '.archive', '.responsive-backup', '.unify-backup', '_backup-cinematic-20260722',
  '_migration-backup', 'Mashreq screenshots',
]);

export function isAllowedOutput(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/').replace(/^\.\//, '');
  if (normalized.split('/').some((part) => part.startsWith('.fuse_hidden'))) return false;
  if (EXCLUDED_SEGMENTS.some((part) => normalized === part || normalized.startsWith(`${part}/`))) return false;
  const root = normalized.split('/')[0];
  return ALLOWED_ROOTS.includes(root) || ['package.json', 'package-lock.json', 'vercel.json', '.gitignore', 'README.md'].includes(normalized);
}
```

Add exact exclusions to `.gitignore`, including `.env*`, `.vercel`, all `EXCLUDED_SEGMENTS`, `*.bak`, and `.fuse_hidden*`. Create `package.json` with `name: "gauravi-portfolio"`, `version: "1.0.0"`, `private: true`, `type: "module"`, and `scripts.test: "node --test tests/**/*.test.mjs"`. Runtime and development dependencies are added only by the tasks that require them.

- [ ] **Step 4: Run the manifest tests**

Run: `npm test -- tests/recovery-manifest.test.mjs`

Expected: 2 tests PASS.

- [ ] **Step 5: Commit the recovery boundary**

```bash
git add .gitignore package.json scripts/recovery-manifest.mjs tests/recovery-manifest.test.mjs
git commit -m "Define sanitized portfolio recovery boundary"
```

### Task 2: Build the deterministic live-site mirror

**Files:**
- Create: `scripts/mirror-live-site.mjs`
- Create: `tests/fixtures/mirror/index.html`
- Create: `tests/fixtures/mirror/styles.css`
- Create: `tests/mirror-live-site.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `ROUTE_MAP`, `isAllowedOutput`
- Produces: `collectReferences(content: string, contentType: string, baseUrl: URL): URL[]`
- Produces: `mirrorSite({ origin: string, destination: string, fetchImpl?: typeof fetch }): Promise<{ written: string[] }>`

- [ ] **Step 1: Write failing parser and origin-boundary tests**

```js
// tests/mirror-live-site.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { collectReferences } from '../scripts/mirror-live-site.mjs';

test('collects same-origin HTML and CSS assets without mail or external links', () => {
  const html = '<link href="/assets/site.css"><img src="/assets/hero.webp"><a href="/work.html">Work</a><a href="mailto:a@b.com">Mail</a><script src="https://cdn.example/x.js"></script>';
  const refs = collectReferences(html, 'text/html', new URL('https://gauravi.design/')).map(String);
  assert.deepEqual(refs.sort(), [
    'https://gauravi.design/assets/hero.webp',
    'https://gauravi.design/assets/site.css',
    'https://gauravi.design/work.html',
  ]);
});

test('collects url() references from CSS', () => {
  const refs = collectReferences('.hero{background:url("../images/sky.webp")}', 'text/css', new URL('https://gauravi.design/assets/css/site.css'));
  assert.equal(String(refs[0]), 'https://gauravi.design/assets/images/sky.webp');
});
```

- [ ] **Step 2: Verify the mirror tests fail**

Run: `node --test tests/mirror-live-site.test.mjs`

Expected: FAIL because the mirror module does not exist.

- [ ] **Step 3: Implement the minimal crawler**

Implement `collectReferences` with Cheerio for `href`, `src`, `poster`, `srcset`, and inline `style`, plus a CSS `url(...)` matcher. Reject URLs whose origin is not `https://gauravi.design`, whose protocol is not HTTP(S), or whose path fails `isAllowedOutput` after route mapping. Implement `mirrorSite` with a queue, a visited set, content-type-aware parsing, and atomic writes under the supplied destination.

The CLI entry point must run only when `import.meta.url === pathToFileURL(process.argv[1]).href` and must accept:

```bash
node scripts/mirror-live-site.mjs --origin https://gauravi.design --destination .
```

- [ ] **Step 4: Run unit tests and fixture integration test**

Run: `npm test -- tests/mirror-live-site.test.mjs`

Expected: parser, origin, route mapping, and fixture write tests PASS.

- [ ] **Step 5: Commit the mirror tooling**

```bash
git add package.json package-lock.json scripts/mirror-live-site.mjs tests/mirror-live-site.test.mjs tests/fixtures/mirror/index.html tests/fixtures/mirror/styles.css
git commit -m "Add deterministic live-site recovery tool"
```

### Task 3: Recover the public site and prove route completeness

**Files:**
- Create: `mockups/*.html`
- Create: `mockups/*.css`
- Create: `mockups/*.js`
- Create: `assets/**`
- Create: `tests/recovered-routes.test.mjs`
- Create: `recovery-report.json`

**Interfaces:**
- Consumes: `mirrorSite`, `ROUTE_MAP`
- Produces: recovered static production tree
- Produces: `recovery-report.json` with `written`, `failed`, `external`, and `excluded` arrays

- [ ] **Step 1: Write the failing recovered-route test**

```js
// tests/recovered-routes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { ROUTE_MAP } from '../scripts/recovery-manifest.mjs';

for (const { urlPath, outputPath } of ROUTE_MAP) {
  test(`recovers ${urlPath} as ${outputPath}`, async () => {
    await access(outputPath);
    const html = await readFile(outputPath, 'utf8');
    assert.match(html, /<!doctype html>|<html/i);
  });
}
```

- [ ] **Step 2: Verify the route test fails before recovery**

Run: `node --test tests/recovered-routes.test.mjs`

Expected: FAIL with `ENOENT` for `mockups/meadow-ship.html`.

- [ ] **Step 3: Run the recovery tool**

Run: `node scripts/mirror-live-site.mjs --origin https://gauravi.design --destination .`

Expected: files are written only beneath `mockups/` and `assets/`; `recovery-report.json` contains no failed production route.

- [ ] **Step 4: Review failures and expand only explicit production references**

Run: `node --test tests/recovered-routes.test.mjs`

If a referenced file is missing, add its exact public path to the manifest only after confirming a production HTML, CSS, or JavaScript file references it. Do not allowlist an entire retained-source folder to silence a failure.

- [ ] **Step 5: Commit the recovered static tree**

```bash
git add mockups assets recovery-report.json tests/recovered-routes.test.mjs
git commit -m "Recover current production portfolio"
```

### Task 4: Recover and harden the AI endpoint

**Files:**
- Create: `api/_prompt.js`
- Create: `api/chat.js`
- Create only if imported by production pages: `api/fog-list.js`, `api/fog-save.js`, `api/lab.js`, `api/visit.js`
- Create: `tests/api-chat.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: default export `handler(req, res): Promise<void>` from `api/chat.js`
- Consumes: `process.env.ANTHROPIC_API_KEY`
- Consumes: `SYSTEM_PROMPT` from `api/_prompt.js`

- [ ] **Step 1: Recover the retained API source without environment values**

Use Vercel's deployment source view for deployment `7hZEZEH5BJHQn9a8F1Q1kpAHDFtA`. Copy only the six named API files. Before saving, search the copied text for key-shaped literals and remove any literal secret; the handler must read `ANTHROPIC_API_KEY` only from `process.env`.

- [ ] **Step 2: Write failing handler-safety tests**

```js
// tests/api-chat.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    setHeader() {},
    write() {},
    end() {},
  };
}

test('rejects non-POST requests', async () => {
  const { default: handler } = await import('../api/chat.js');
  const res = responseRecorder();
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.body, { error: 'Method not allowed' });
});

test('fails safely when the Anthropic key is absent', async () => {
  const previous = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const { default: handler } = await import(`../api/chat.js?missing-key=${Date.now()}`);
  const res = responseRecorder();
  await handler({ method: 'POST', headers: {}, body: { messages: [] } }, res);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { error: 'Assistant temporarily unavailable' });
  if (previous) process.env.ANTHROPIC_API_KEY = previous;
});
```

- [ ] **Step 3: Verify the missing-key test fails for the retained handler**

Run: `node --test tests/api-chat.test.mjs`

Expected: the GET test passes; the missing-key test fails because the retained handler does not return the specified 503 response.

- [ ] **Step 4: Add the minimal safe configuration guard**

Move Anthropic client construction behind this guard at the start of the POST path:

```js
if (!process.env.ANTHROPIC_API_KEY) {
  return res.status(503).json({ error: 'Assistant temporarily unavailable' });
}
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

- [ ] **Step 5: Run API tests and install exact runtime dependencies**

Run: `npm install @anthropic-ai/sdk @vercel/blob`

Run: `npm test -- tests/api-chat.test.mjs`

Expected: both API tests PASS; no secret value appears in tracked files.

- [ ] **Step 6: Commit the recovered API**

```bash
git add api package.json package-lock.json tests/api-chat.test.mjs
git commit -m "Recover and harden portfolio assistant API"
```

### Task 5: Restore Vercel routing and local preview

**Files:**
- Create: `vercel.json`
- Create: `playwright.config.mjs`
- Create: `tests/baseline-routes.spec.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: recovered `mockups/`, `assets/`, and `api/`
- Produces: `npm run dev` using `vercel dev`
- Produces: `npm run test:e2e` using Playwright

- [ ] **Step 1: Restore the exact retained route configuration**

Copy the 32-line retained `vercel.json`, including redirects for `/making`, `/lab.html`, `/journey`, and `/meadow.html`; rewrites for `/`, `/lab`, `/site-info`, `/blog`, `/artofmaking`, `/bridging`, `/say-my-name`, `/yawn`, and the fallback into `/mockups`; and the non-asset cache headers.

- [ ] **Step 2: Write failing browser-route tests**

```js
// tests/baseline-routes.spec.mjs
import { test, expect } from '@playwright/test';

for (const path of ['/', '/work.html', '/beyond.html', '/lab', '/blog.html', '/case-googlehealth.html']) {
  test(`${path} renders without a page error`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).not.toBeEmpty();
    expect(await page.locator('img').evaluateAll((images) => images.filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute('src')).length)).toBe(0);
  });
}
```

- [ ] **Step 3: Verify the browser tests initially fail before local preview setup**

Run: `npx playwright test tests/baseline-routes.spec.mjs`

Expected: FAIL because no configured web server is available.

- [ ] **Step 4: Configure the preview and browser test runner**

Install `vercel` and `@playwright/test` as dev dependencies. Configure Playwright with `baseURL: 'http://127.0.0.1:3000'`, desktop Chromium plus a 390 by 844 mobile project, and `webServer.command: 'npm run dev -- --listen 127.0.0.1:3000'`. Add `dev` and `test:e2e` scripts.

- [ ] **Step 5: Run local static and browser suites**

Run: `npm test`

Run: `npm run test:e2e`

Expected: all unit and route tests PASS on desktop and mobile.

- [ ] **Step 6: Commit reproducible local preview**

```bash
git add vercel.json playwright.config.mjs package.json package-lock.json tests/baseline-routes.spec.mjs
git commit -m "Make recovered portfolio reproducible locally"
```

### Task 6: Complete the privacy and baseline parity gate

**Files:**
- Create: `scripts/audit-tracked-files.mjs`
- Create: `tests/audit-tracked-files.test.mjs`
- Create: `README.md`
- Modify: `package.json`

**Interfaces:**
- Produces: `auditPaths(paths: string[]): { violations: string[] }`
- Produces: `npm run audit:privacy`

- [ ] **Step 1: Write the failing privacy-audit test**

```js
// tests/audit-tracked-files.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { auditPaths } from '../scripts/audit-tracked-files.mjs';

test('reports secrets and excluded source paths', () => {
  const result = auditPaths(['mockups/work.html', '.env.local', 'Resumes/private.pdf', '.agents/config.md']);
  assert.deepEqual(result.violations, ['.env.local', 'Resumes/private.pdf', '.agents/config.md']);
});
```

- [ ] **Step 2: Verify the privacy test fails**

Run: `node --test tests/audit-tracked-files.test.mjs`

Expected: FAIL because the audit module does not exist.

- [ ] **Step 3: Implement the tracked-file audit**

Implement `auditPaths` using `EXCLUDED_SEGMENTS`, `.env` matching, key/token filename matching, and `isAllowedOutput`. The CLI must read `git ls-files -z`, fail with exit code 1 when violations exist, and print only paths—not file contents.

- [ ] **Step 4: Add documentation and run the full gate**

Document local setup, `npm test`, `npm run test:e2e`, `npm run audit:privacy`, `vercel dev`, required environment-variable names without values, and the Vercel/GitHub workflow in `README.md`.

Run: `npm test && npm run audit:privacy && npm run test:e2e`

Expected: all tests PASS; privacy audit reports zero violations.

- [ ] **Step 5: Compare local and live critical routes**

Capture desktop and 390px mobile screenshots for `/`, `/work.html`, `/beyond.html`, `/lab`, and `/case-googlehealth.html` from both origins. Confirm matching text, imagery, navigation, and interactive affordances before any consistency change. Record intentional recovery-only differences in `recovery-report.json`.

- [ ] **Step 6: Commit the baseline gate**

```bash
git add README.md package.json scripts/audit-tracked-files.mjs tests/audit-tracked-files.test.mjs recovery-report.json
git commit -m "Add privacy and parity gates for recovered site"
```
