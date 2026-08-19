# Portfolio Recovery, Consistency, and GitHub Migration Design

## Purpose

Recover the current `gauravi.design` portfolio into a maintainable Git repository, preserve its Vercel-hosted AI assistant, correct the highest-impact visual and accessibility inconsistencies found in the live audit, and connect the cleaned repository to the existing Vercel project.

The domain remains registered and managed in GoDaddy. Vercel remains the production host because the site includes a server-side `/api/chat` endpoint that GitHub Pages cannot run.

## Current State

- `gauravi.design` and `www.gauravi.design` resolve to Vercel.
- GoDaddy manages the domain but does not host the current site.
- The Vercel project is named `n` and has no connected Git repository.
- Vercel retained a browsable source tree for earlier deployments.
- The retained deployment contains production site files alongside private, temporary, and unrelated material.
- The live site includes a Claude-powered `/api/chat` serverless function and Vercel dependencies.

## Recommended Architecture

The website will use a public GitHub repository as its source of truth and the existing Vercel Hobby project as its free production host.

The repository will contain:

- Production HTML pages and route files.
- Stylesheets, browser-side JavaScript, fonts, images, videos, and other assets required by those pages.
- The `/api/chat` serverless function and only the supporting modules it imports.
- `package.json`, its lockfile, and the minimum Vercel configuration required to reproduce the deployment.
- Automated static and browser-level regression checks.
- Project documentation, including local preview and deployment instructions.

The repository will not contain:

- Resumes or job-search working files that are not deliberately published website assets.
- `.agents`, `.claude`, `.superpowers`, or other local assistant configuration.
- Temporary folders such as `_fxcheck_tmp`.
- Unused experiments, screenshots, or prototypes unless a production page links to them or imports them.
- Environment variables, API keys, browser data, deployment tokens, or account metadata.

## Recovery Strategy

Recovery will favor the retained Vercel deployment source because it preserves the original authored files and backend function. If Vercel does not offer a safe bulk export, recovery will combine:

1. A same-origin mirror of the currently public website and all referenced production assets.
2. Required server-side files copied from Vercel's retained source view.
3. Configuration reconstructed from the retained `package.json`, lockfile, and Vercel settings.

Every recovered file will be classified as required production source, intentionally published content, or excluded material before it enters the repository.

The first commit will represent the current live site as closely as practical. Consistency and accessibility fixes will follow in separate commits so the migration baseline and design changes remain distinguishable.

## Consistency Changes

The first implementation pass will address the audited problems without changing the site's core art direction.

### Content and positioning

- Use one canonical positioning statement across page titles, the home hero, and About.
- Render final credibility statistics in HTML and animate only a visual duplicate so scripts, search engines, and assistive technology never receive zero values.
- Standardize global navigation labels, logo spacing, apostrophes, CTA names, and arrow conventions.

### Typography and color

- Establish shared tokens for Switzer display/body typography and Geist Mono metadata/interface typography.
- Remove accidental Arial fallbacks from portfolio controls.
- Keep product-demo typefaces scoped inside their respective demonstrations.
- Establish a documented ink, neutral, blue, yellow, and surface palette.
- Replace failing normal-text combinations, including light gray and bright blue on white, while retaining yellow on dark surfaces.

### Motion

- Define fast, standard, and expressive motion durations with a small set of shared easings.
- Replace broad `transition: all` declarations in touched components with explicit properties.
- Reduce simultaneous attention-seeking loops in the home hero while preserving ambient sky motion.
- Preserve and test the existing comprehensive `prefers-reduced-motion` behavior.

### Responsive behavior and accessibility

- Keep the About media stack inside the mobile viewport.
- Make Google Health embeds responsive and prevent clipping.
- Provide at least a 44 by 44 CSS-pixel hit area for interactive controls.
- Add the missing About H1 and consistent `main`, `nav`, `header`, and `footer` landmarks.
- Name empty focusable links and the scene range control, or remove them from the accessibility tree when decorative.
- Standardize visible keyboard focus treatment.
- Retain empty alt text only for genuinely decorative images.

## Testing Strategy

Tests will be written before production changes and will cover:

- Required production routes and assets resolve locally.
- No private or excluded paths are tracked.
- Canonical navigation labels and positioning copy are consistent across core pages.
- Final statistics are present in initial HTML.
- Core pages have the expected H1 and semantic landmarks.
- Interactive controls have accessible names.
- Mobile pages do not create document-level horizontal overflow.
- Targeted controls meet the minimum hit-area requirement.
- Google Health embeds remain within their mobile container.
- Reduced-motion styles remain present and suppress nonessential animation.
- `/api/chat` loads without exposing secrets and handles missing configuration safely.

Desktop and mobile browser checks will compare the recovered local site with the live baseline before changes, then verify the corrected behavior after changes.

## Deployment and Cutover

1. Create a public GitHub repository after the sanitized local baseline is ready.
2. Review the tracked-file list for private or unrelated material before the first push.
3. Connect the repository to the existing Vercel project `n`.
4. Configure required environment variables directly in Vercel; never store their values in Git.
5. Generate and validate a Vercel preview deployment.
6. Compare critical routes, the AI assistant, responsive behavior, and console output with the current production site.
7. Promote only the verified Git-connected deployment to production.
8. Leave GoDaddy DNS unchanged unless Vercel explicitly requires a verified adjustment.

Any action that creates a GitHub repository, changes Vercel project settings, modifies DNS, or promotes a deployment requires an action-time confirmation immediately before it occurs.

## Rollback

The current production deployment remains untouched during recovery and implementation. Vercel's existing production deployment and instant rollback history provide the cutover fallback. If the Git-connected deployment fails validation after promotion, restore the prior production deployment while retaining the Git repository for correction.

## Success Criteria

- A sanitized, reproducible Git repository contains the complete production site and AI endpoint.
- No secrets, private working files, or unrelated deployment artifacts are tracked.
- Local and Vercel preview builds serve all critical routes and assets.
- The audited high-priority consistency, responsive, and accessibility defects are covered by regression checks and corrected.
- `gauravi.design` continues to use HTTPS and the AI assistant remains functional.
- Future pushes to the selected Git branch create Vercel deployments automatically.
