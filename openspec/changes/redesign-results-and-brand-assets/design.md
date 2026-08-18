## Context

The validated analysis result already contains the full compatibility matrix, group and per-member recommendations, member-scoped restaurant questions, and evidence provenance. The existing results UI renders that complete data set as a long sequence of large dish cards, each containing every member row, then repeats per-member recommendations farther down the page. The supplied reference instead organizes the same information around a person switcher and compact dish accordions.

The redesign must preserve the existing analysis contract and Moomina's established warm red, green, cream, rounded visual language. The supplied logo is a JPEG whose checkerboard is baked into the pixels, while the supplied food illustration is suitable as a repeating page pattern.

## Goals / Non-Goals

**Goals:**

- Make the answer for a specific person reachable without scrolling through the whole matrix.
- Preserve all compatibility reasoning, evidence, recommendation, question, and safety information.
- Show the selected person's stated likes, dislikes, spice tolerance, and relevant confirmation questions.
- Use the supplied logo and food pattern as real optimized assets.
- Carry the branded shell consistently across all four primary flow routes without changing their behavior.
- Keep the results view responsive and keyboard accessible.

**Non-Goals:**

- Change analysis schemas, ranking, hard-restriction rules, or AI prompts.
- Add persistence, editing of preset profiles, or new routes.
- Reproduce the reference screenshot pixel-for-pixel or replace Moomina's broader component system.

## Decisions

### Results are member-first with an `All` overview

The initial selection is the current user because that answers the most immediate question and keeps the first screen concise. Each member tab renders only that member's recommendation, preference summary, dish rows, and questions. `All` renders the existing table-wide recommendation and compact dishes with a status summary for every member.

Alternative considered: defaulting to `All`. This retains the current group-first emphasis but does not solve the first-load density as effectively.

### Existing result data is projected in the client

Small pure selectors will derive rows, recommendations, and questions for the active member from the existing validated `AnalysisResult`. No API or schema change is needed, and the selectors can be unit tested independently.

Alternative considered: reshape the server response. This would duplicate grouping behavior and create unnecessary contract risk for a presentation-layer problem.

### Disclosure preserves detail without preserving height

Each dish appears as a single compact native disclosure row. The summary shows the dish, price, active status, and preference score. Opening it reveals reasons, uncertainties, listed ingredients, and evidence. The `All` overview shows compact member status chips inside each disclosure rather than five separately expanded cards.

### Confirmation questions follow the active context

Member tabs filter `restaurantQuestions` by `memberIds`; the `All` tab shows deduplicated questions for the group. This uses existing question provenance and avoids suggesting irrelevant questions to a person.

### Supplied brand files remain presentation assets

The food illustration is copied into `public` and applied with CSS `background-repeat: repeat` plus an explicit tile width; it is never stretched to the viewport. The logo is converted to a transparent PNG and used by the root layout. The results content sits on a semi-opaque cream surface so the pattern does not reduce readability.

### Primary routes share one page-shell recipe

Onboarding, Group, Scan, and Results use the same transparent outer page layer, top clearance for the fixed logo, rounded semi-opaque header surface, and semi-opaque content surface. Page-specific maximum widths remain intact so form fields, group cards, and scan controls do not become unnecessarily wide. Existing interactive components keep their behavior and internal hierarchy; only their container treatment, spacing, borders, and shadows are normalized.

Alternative considered: putting one opaque full-height wrapper around every route. That would hide most of the supplied pattern and repeat the original inconsistency, so the design uses two readable surfaces with visible patterned breathing room instead.

## Risks / Trade-offs

- [A user may overlook another member's status after selecting one person] → Keep all member tabs visible and include an explicit `All` overview.
- [Disclosures can hide important conflicts] → Keep status and score visible in every collapsed row and sort conflicts/confirmation needs ahead of compatible dishes only where the recommendation order does not already communicate priority.
- [Automatic logo background removal may soften edges] → Inspect the alpha result at display scale and retain the source colors and proportions without redesigning the mark.
- [The background can become visually noisy] → Use a controlled tile size and a translucent central results surface with sufficient contrast.
- [Long forms could lose contrast over the pattern] → Keep all form controls on a high-opacity rounded cream surface and retain white input backgrounds.

## Migration Plan

1. Add the processed logo and supplied pattern under stable public asset names.
2. Replace the shell logo source and add the tiled background style.
3. Apply the shared shell treatment to onboarding, group, scan, and results while retaining their route-specific content widths.
4. Replace the results matrix presentation with member-scoped selectors and disclosures.
5. Add selector tests and run lint, type checks, unit tests, production build, OpenSpec validation, and browser visual QA.
6. Roll back by restoring the previous page wrappers, `ResultsView`, and logo source; the analysis data remains unchanged.

## Open Questions

None. The supplied reference, brand assets, existing profiles, and validated result contract provide enough detail to implement this presentation change.
