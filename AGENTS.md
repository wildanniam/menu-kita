# MenuKita Agent Guide

Follow the global Wildan coding standard and these repository-specific rules.

## Start here

## Mandatory OpenSpec tracking

Every repository update MUST be tracked by OpenSpec. This includes code, documentation, tests, configuration, dependencies, generated files, formatting, and urgent fixes. There are no undocumented-edit exceptions.

Before editing any project file:

1. Read `README.md` and `codex_project_context_food_compatibility_ai.md`.
2. Run `openspec list --json`.
3. Identify the named active OpenSpec change that covers the intended edit.
4. If none covers it, create and document a new OpenSpec change before editing other project files.
5. Read its proposal, specs, design, and tasks.
6. Ensure the intended edit maps to an existing checkbox task; add the task before implementation when needed.

The active OpenSpec artifacts are authoritative when exploratory notes conflict with them.

During work:

- Implement only work described by the governing change.
- Update proposal, specs, design, risks, or tasks immediately when discussion, implementation, or review changes a decision or reveals new work.
- Mark a task complete only after its outcome is implemented and verified.
- Never leave a material decision only in chat, an issue, a commit message, or a pull-request comment.

Before presenting a pull request as ready:

1. Run `openspec validate <change> --strict` successfully.
2. Include the change name/path and task progress in the pull-request body.
3. Commit the governing OpenSpec artifacts alongside the files they govern.
4. State any incomplete tasks or deviations explicitly.

After a completed change is accepted, archive it through OpenSpec and verify that its specifications are synchronized into the durable project specs.

## Collaboration workflow

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
