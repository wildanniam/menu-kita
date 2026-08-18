## Why

The current results screen renders every dish and every member at once, forcing users to scroll through a long matrix before they can answer the practical question, “what can this person eat?” The supplied MenuKita brand assets also need to replace the temporary logo and plain background so the demo presents one coherent visual system.

## What Changes

- Add an interactive member switcher with one tab per group member plus an `All` group overview.
- Present dishes as compact expandable rows scoped to the selected member instead of expanding the full member-by-dish matrix on the page.
- Surface each member's food preferences, best option, compatibility status, and relevant restaurant-confirmation questions within that member's view.
- Keep the shared group recommendation and a condensed all-members overview available without duplicating the full matrix.
- Replace the temporary logo with a transparent version of the supplied MenuKita lockup.
- Apply the supplied food illustration as a repeating, non-stretched background with a readable content surface.
- Extend the same patterned shell and translucent cream content treatment across Preferences, Group, and Scan so every primary flow step shares one visual system.
- Verify responsive behavior, keyboard-accessible switching and accordions, and the complete results journey against the supplied visual reference.

## Capabilities

### New Capabilities

- `member-focused-results`: Compact member and group result exploration, including scoped dish compatibility and confirmation questions.
- `branded-app-shell`: Supplied MenuKita logo and repeatable food-pattern presentation in the application shell.

### Modified Capabilities


## Impact

- Onboarding, group, scan, and results routes plus their existing client-side content surfaces.
- Application shell, global styles, and public brand assets.
- Result-focused tests and visual QA documentation.
- No change to the analysis API, AI orchestration, compatibility rules, or persisted result contract.
