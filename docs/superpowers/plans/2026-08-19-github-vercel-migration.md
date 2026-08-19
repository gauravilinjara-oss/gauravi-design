# GitHub and Vercel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the sanitized portfolio repository to GitHub, connect it to the existing Vercel project, validate a preview, and cut over production without changing GoDaddy DNS.

**Architecture:** GitHub becomes the source of truth on `main`; Vercel Hobby continues hosting static pages and `/api/chat`. A privacy gate runs before every push, Vercel environment variables remain dashboard-only, and production promotion happens only after preview parity and AI checks pass.

**Tech Stack:** Git, GitHub, Vercel Hobby, Vercel CLI/dashboard, GoDaddy DNS, Playwright, Node.js.

**Spec:** `docs/superpowers/specs/2026-08-19-portfolio-recovery-migration-design.md`

## Global Constraints

- The GitHub repository is public.
- Never push secrets, environment values, private work files, browser data, or deployment tokens.
- Preserve the existing Vercel project `n`, custom domain `gauravi.design`, and AI endpoint.
- Do not change GoDaddy DNS unless preview and domain verification prove an adjustment is required.
- Creating the GitHub repository, connecting Git in Vercel, changing environment settings, or promoting production requires action-time user confirmation.
- Keep the existing production deployment available for instant rollback.

---

### Task 1: Add a mandatory pre-push privacy gate

**Files:**
- Create: `.githooks/pre-push`
- Modify: `package.json`
- Modify: `README.md`
- Test: `tests/audit-tracked-files.test.mjs`

**Interfaces:**
- Consumes: `npm run audit:privacy`
- Produces: a local pre-push hook that exits nonzero on privacy violations.

- [ ] **Step 1: Write the failing hook-presence assertion**

Add to `tests/audit-tracked-files.test.mjs`:

```js
test('pre-push hook runs the privacy audit', async () => {
  const hook = await readFile('.githooks/pre-push', 'utf8');
  assert.match(hook, /npm run audit:privacy/);
});
```

- [ ] **Step 2: Verify the test fails**

Run: `node --test tests/audit-tracked-files.test.mjs`

Expected: FAIL with `ENOENT` for `.githooks/pre-push`.

- [ ] **Step 3: Add the hook and install command**

```sh
#!/bin/sh
set -eu
npm run audit:privacy
```

Add `"prepare": "git config core.hooksPath .githooks"` to `package.json`, mark the hook executable, run `npm run prepare`, and document the gate in `README.md`.

- [ ] **Step 4: Run the privacy suite**

Run: `npm test -- tests/audit-tracked-files.test.mjs && npm run audit:privacy`

Expected: tests PASS and zero violations are reported.

- [ ] **Step 5: Commit the push gate**

```bash
git add .githooks/pre-push package.json README.md tests/audit-tracked-files.test.mjs
git commit -m "Require privacy audit before pushes"
```

### Task 2: Create and verify the public GitHub repository

**Files:**
- Modify: Git remote configuration only

**Interfaces:**
- Produces: `origin` pointing to the new public GitHub repository.

- [ ] **Step 1: Run the final local release gate**

Run: `git status --short && npm test && npm run audit:privacy && npm run test:e2e`

Expected: clean working tree, all tests PASS, zero privacy violations.

- [ ] **Step 2: Review the exact public file list**

Run: `git ls-files`

Expected: only documented production source, tests, scripts, and documentation; none of the excluded segments from the specification.

- [ ] **Step 3: Request action-time confirmation**

Ask the user to confirm creation of a public GitHub repository containing the exact reviewed tracked files. Do not continue without confirmation.

- [ ] **Step 4: Create the repository and push `main`**

Use the authenticated GitHub CLI or GitHub UI to create `gauravi-portfolio` under the user's account, public, without auto-generated README or license. Then run:

```bash
git remote add origin git@github.com:gauravilinjara-oss/gauravi-portfolio.git
git push -u origin main
```

If the authenticated account name differs, use the repository URL returned by GitHub instead of guessing the owner.

- [ ] **Step 5: Verify remote visibility and exclusions**

Run: `git ls-remote --heads origin main`

Open the public repository file browser and verify `.env`, private folders, backup folders, and Vercel account files are absent.

### Task 3: Connect the GitHub repository to Vercel

**Files:**
- Modify: Vercel project integration only

**Interfaces:**
- Consumes: public GitHub repository `main` branch.
- Produces: automatic Vercel deployments for GitHub pushes.

- [ ] **Step 1: Verify required environment-variable names without reading values**

In Vercel project `n`, inspect the Environment Variables list and confirm `ANTHROPIC_API_KEY` exists for Preview and Production. Record only presence and target environments; never copy or display the value.

- [ ] **Step 2: Request action-time confirmation**

Ask the user to confirm connecting the public GitHub repository to Vercel project `n`. Explain that future pushes will create deployments and production pushes may update the custom domain depending on Vercel's production-branch setting.

- [ ] **Step 3: Connect Git and lock production branch**

In project `n` → Settings → Git, connect the exact repository and set Production Branch to `main`. Ensure automatic preview deployments are enabled and do not manually promote the first build.

- [ ] **Step 4: Verify the integration**

Confirm the project overview displays the GitHub repository and `main` as Production Branch. Confirm a Git-triggered deployment appears with a Git commit SHA and remains a preview until validation completes.

### Task 4: Validate the Git-connected preview

**Files:**
- Create: `tests/preview-smoke.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `PREVIEW_ORIGIN` environment variable.
- Produces: `npm run test:preview`.

- [ ] **Step 1: Write the preview smoke test**

```js
// tests/preview-smoke.mjs
import assert from 'node:assert/strict';

const origin = process.env.PREVIEW_ORIGIN;
assert.ok(origin, 'PREVIEW_ORIGIN is required');

for (const path of ['/', '/work.html', '/beyond.html', '/lab', '/blog.html', '/case-googlehealth.html']) {
  const response = await fetch(new URL(path, origin), { redirect: 'follow' });
  assert.equal(response.status, 200, `${path}: ${response.status}`);
  assert.match(response.headers.get('content-type') ?? '', /text\/html/, path);
}

const chat = await fetch(new URL('/api/chat', origin), { method: 'GET' });
assert.equal(chat.status, 405, 'GET /api/chat must be rejected safely');
```

- [ ] **Step 2: Verify the test requires a preview origin**

Run: `node tests/preview-smoke.mjs`

Expected: FAIL with `PREVIEW_ORIGIN is required`.

- [ ] **Step 3: Run automated preview validation**

Add `"test:preview": "node tests/preview-smoke.mjs"`. Set `PREVIEW_ORIGIN` only for the command invocation; do not save it to tracked configuration.

Run: `PREVIEW_ORIGIN=https://<vercel-preview-host> npm run test:preview`

Expected: all core routes return 200 and GET `/api/chat` returns 405.

- [ ] **Step 4: Validate the AI assistant manually without exposing secrets**

Open the preview, ask one non-sensitive portfolio question, and verify a streamed response arrives. Confirm the browser console contains no missing-key error and the network response contains no environment values.

- [ ] **Step 5: Run visual and responsive preview tests**

Run Playwright against the preview origin at desktop and 390 by 844. Compare `/`, `/work.html`, `/beyond.html`, `/lab`, `/blog.html`, and `/case-googlehealth.html` with the approved local result. Verify no document-level horizontal overflow and no broken local assets.

- [ ] **Step 6: Commit the preview smoke test**

```bash
git add package.json tests/preview-smoke.mjs
git commit -m "Add Vercel preview smoke checks"
git push origin main
```

### Task 5: Promote and verify production

**Files:**
- Modify: Vercel production state only

**Interfaces:**
- Produces: verified Git-connected production deployment at `https://gauravi.design`.

- [ ] **Step 1: Record the rollback target**

Record the current production deployment ID shown in project `n` and confirm Vercel's Instant Rollback control is available. Do not copy account tokens or private URLs into Git.

- [ ] **Step 2: Confirm DNS remains suitable**

Run:

```bash
dig gauravi.design A +short
dig www.gauravi.design CNAME +short
```

Expected: the apex remains on Vercel and `www` remains `cname.vercel-dns.com.`. No GoDaddy change is required.

- [ ] **Step 3: Request action-time production confirmation**

Tell the user the exact preview deployment to be promoted, the custom domain affected, and the recorded rollback target. Do not promote without confirmation.

- [ ] **Step 4: Promote the verified Git deployment**

Use Vercel's Promote to Production control for the validated deployment. Do not use Undo Rollback or modify domain assignment until the selected deployment ID is confirmed.

- [ ] **Step 5: Run fresh production verification**

Run:

```bash
PREVIEW_ORIGIN=https://gauravi.design npm run test:preview
```

Then run desktop and mobile Playwright suites against production and manually verify one AI response. Confirm HTTPS is enforced for both apex and `www`.

- [ ] **Step 6: Roll back on any critical failure**

If a core route, asset, mobile layout, or `/api/chat` fails, immediately restore the recorded prior production deployment through Vercel Instant Rollback, report the failed check, and leave Git history intact for correction.

- [ ] **Step 7: Document the successful cutover**

Add the GitHub repository URL, Vercel project name, production branch, verification date, and rollback procedure to `README.md`; do not include deployment tokens or environment values.

```bash
git add README.md
git commit -m "Document GitHub and Vercel deployment workflow"
git push origin main
```

