# MenuKita Agent Guide

Follow the global Wildan coding standard and these repository-specific rules.

## Start here

Before changing the project:

1. Read `README.md` and `codex_project_context_food_compatibility_ai.md`.
2. Run `openspec list --json`.
3. Read the relevant OpenSpec proposal, specs, design, and tasks.
4. Run `openspec validate <change> --strict` after editing artifacts.

The active OpenSpec artifacts are authoritative when exploratory notes conflict with them.

## Collaboration workflow

- Capture material requirement or architecture decisions in OpenSpec, not only in chat.
- Use a separate OpenSpec change for new scope that is not part of `build-menukita-group-demo`.
- Use issue-driven branches and pull requests for meaningful implementation work.
- Do not implement unapproved scope or silently rewrite another collaborator's visual or domain decisions.
- Moomina leads the brand system and UI presentation. Preserve her work and coordinate before changing shared UI foundations.
- Final preset group data and demo images are pending inputs from Wildan.

## Locked technical boundaries

- Use direct TypeScript orchestration with OpenAI SDK, Tavily SDK, and Zod; do not introduce LangChain without an approved design change.
- Keep OpenAI and Tavily credentials server-only.
- Keep hard restrictions separate from preferences and preserve evidence provenance.
- Do not claim that a dish is definitely safe, allergy-safe, or certified halal.
- Do not add authentication, a database, group invitations, or sharing to the hackathon MVP.
