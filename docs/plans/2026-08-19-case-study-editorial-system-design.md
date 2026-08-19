# Satoshi Editorial Case-Study System

**Date:** 2026-08-19  
**Status:** Approved design  
**Reference:** [Bridgeway case study](https://bridgeway-case.vercel.app/)

## Objective

Unify gauravi.design around Satoshi and give every portfolio case study the polished editorial structure of the Bridgeway reference without erasing the visual identity, evidence, or interactive demonstrations unique to each project.

## Scope

The editorial case-study system applies to:

- Podonos
- FX Online
- smartTRADE
- Business Online
- Mashreq Customer Care
- Google Health

Satoshi also becomes the primary typeface across the rest of gauravi.design so the portfolio reads as one coherent system.

## Chosen approach

Build a shared editorial shell and shared design tokens for all case studies. Preserve project-specific demonstrations, screenshots, accent colors, and evidence as content modules inside that shell.

This approach was selected over independently restyling each page or making every page a literal Bridgeway clone. It gives the portfolio a consistent reading experience while retaining the individuality and credibility of each project.

## Typography

- Use Satoshi for portfolio navigation, headings, body copy, labels, captions, buttons, metadata, and case-study navigation.
- Remove the current portfolio-level mixture of Switzer, Geist Mono, and Fraunces.
- Use a restrained weight system:
  - 400 for body copy and large editorial titles
  - 500 for headings, navigation, and controls
  - 600 for limited emphasis and important metrics
- Use sentence case for headings instead of enforcing lowercase.
- Use letter spacing, size, weight, and color—not a separate monospace family—to distinguish eyebrows and metadata.
- Product-faithful embedded prototypes may retain their native product typeface only when typography is part of the demonstrated design. For example, Google Health's Material interface can retain Roboto Flex inside the prototype while the surrounding case-study narrative uses Satoshi.
- Deliver Satoshi as performant webfont files with appropriate fallbacks and font-display behavior.

## Shared page architecture

Each case study follows the same editorial sequence:

1. Persistent case-study sidebar
2. Project introduction
3. Primary project visual
4. Role, timeline, team, and skills metadata
5. Overview and problem framing
6. Research and evidence
7. Strategic shift or design principles
8. Solution walkthrough
9. Impact and outcomes
10. Reflection and next case

The sequence is a narrative framework, not a requirement to invent missing sections. Existing content is reorganized and relabeled where appropriate, while claims and outcomes remain grounded in the current case-study material.

## Desktop layout

- Use a warm, pale sidebar fixed to the left edge.
- The sidebar contains project identity, project type or role, a subtle divider, and scroll-aware section links.
- Offset the editorial content from the sidebar and constrain prose to a comfortable reading width.
- Allow key visuals and demonstrations to extend beyond the prose column when their detail benefits from additional width.
- Establish generous vertical whitespace between narrative chapters.
- Keep the global portfolio navigation visually secondary while a case study is being read.

## Mobile layout

- Remove the fixed left rail below the desktop breakpoint.
- Replace it with a compact case-study header and section navigator.
- Keep prose, metadata, and media in a single readable column.
- Preserve section anchors and progress awareness without reducing the content width.
- Ensure interactive demonstrations remain usable by touch and do not create horizontal overflow.

## Content hierarchy

### Introduction

- Small, tracked project eyebrow
- Large, restrained title
- Concise thesis explaining the problem and contribution
- Primary visual or interactive hero
- Compact metadata grid

### Narrative chapters

- Consistent eyebrow and section-title relationship
- Short introductory paragraphs before complex visuals
- Large images or demonstrations with standardized captions
- Pull quotes, metrics, comparisons, and cards used only where they clarify evidence
- Fewer decorative surfaces so the strongest artifacts receive attention

### Closing

- Outcome or impact summary
- Honest reflection covering constraints, learning, and next steps
- Clear transition to the next case study

## Color and surfaces

- Use a warm white main canvas and a slightly tinted sidebar.
- Use charcoal for primary text and a reduced set of softer grays for secondary text, captions, and inactive navigation.
- Use thin neutral dividers.
- Retain one restrained accent color per project.
- Avoid using accent colors for large amounts of body text.
- Preserve brand colors inside product artifacts and prototypes where they are evidence of the work.
- Reduce competing gradients, glass effects, and ornamental card treatments in the editorial shell.

## Motion and interaction

- Use gentle fade-and-rise reveals for editorial content.
- Use subtle media movement only when it supports the story.
- Keep sidebar scroll tracking and smooth anchor navigation.
- Remove or tone down tilt, shine, and overlapping entrance effects that compete for attention.
- Preserve meaningful product interactions inside demos.
- Respect `prefers-reduced-motion` across all shared and project-specific motion.
- Keep focus states visible and keyboard navigation predictable.

## Shared implementation model

- Introduce one shared case-study stylesheet for typography, layout, spacing, colors, captions, responsive behavior, and motion defaults.
- Evolve the existing shared sidebar script instead of creating six independent navigation implementations.
- Add explicit section labels and stable anchors where automatic inference is insufficient.
- Keep project-specific styles scoped to project artifacts and demonstrations.
- Centralize Satoshi font declarations and core typography tokens so changes propagate consistently across the portfolio.
- Avoid a full framework migration; the current static-site architecture can support the system with substantially less risk.

## Accessibility and performance

- Maintain semantic heading order and landmarks.
- Verify readable contrast for primary, secondary, and accent text.
- Preserve alt text and meaningful figure captions.
- Ensure sticky elements do not obscure anchored headings.
- Validate keyboard access for navigation and interactive demos.
- Use optimized webfont formats, preload only required styles, and avoid layout shift during font loading.
- Test reduced motion, mobile viewport behavior, and zoomed text.

## Verification

Before release, verify:

- Satoshi is applied consistently across the portfolio shell and narrative content.
- Product-native fonts appear only inside intentionally preserved prototypes.
- All six case studies share the same hierarchy and spacing system.
- Sidebar navigation highlights the correct section and every link lands accurately.
- Desktop, tablet, and mobile layouts have no clipping or horizontal overflow.
- Existing demos still function.
- The pages remain usable with keyboard navigation and reduced motion.
- Page screenshots show consistent visual rhythm while retaining each project's identity.
- The deployed Vercel preview is reviewed before promoting the changes to gauravi.design.

## Non-goals

- Rewriting case-study claims or inventing impact metrics
- Removing useful project-specific prototypes and evidence
- Rebuilding the site in a new frontend framework
- Reproducing Bridgeway pixel for pixel
- Making all project artifacts use the same accent color or product UI style
