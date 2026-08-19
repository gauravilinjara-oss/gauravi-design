# Gauravi Linjara — Portfolio

This repository contains the sanitized production source for [gauravi.design](https://gauravi.design). It preserves the current public routes, media, and Claude-powered portfolio assistant while excluding private files retained by earlier deployments.

## Local setup

Requirements: Node.js 18 or newer and npm.

```bash
npm install
npx playwright install chromium
npm run preview
```

The local preview runs through Vercel's local runtime so redirects, rewrites, and `/api/chat` behave like production. The assistant requires an environment variable named `ANTHROPIC_API_KEY`; never commit its value or any `.env` file.

## Checks

```bash
npm test
npm run audit:privacy
npm run test:e2e
```

- `npm test` checks recovery completeness and API safety.
- `npm run audit:privacy` rejects private paths and sensitive filenames from tracked source.
- `npm run test:e2e` checks critical routes in desktop and 390 px mobile Chromium.

## Deployment workflow

The intended free workflow is:

1. Keep this source in a GitHub repository.
2. Connect that repository to the existing Vercel project.
3. Let Vercel create preview deployments for changes.
4. Promote only a verified deployment to production.
5. Keep GoDaddy as the domain registrar; the existing DNS continues to point to Vercel.

Do not upload the retained deployment's private folders, environment values, browser data, or unrelated prototypes. Run all three checks before pushing a release.

## Recovery notes

The live source was recovered from the current Vercel deployment. Two favicon references on `/health` already return 404 in production (`/assets/gh-icon-180.png` and `/assets/gh-icon.svg`); their working retained copies are under `mockups/assets/` and are repaired in the consistency pass after the baseline commit.
