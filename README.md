# MenuKita

MenuKita is an AI food compatibility assistant for groups navigating unfamiliar menus. A user completes a short food-profile questionnaire, joins a preset demo group, uploads a menu image, and receives evidence-aware recommendations for the whole group and each member.

This repository contains the MenuKita Next.js prototype, typed domain contracts, UI flow, server-side agent workflow, and OpenSpec implementation plan.

## Local development

Requirements:

- Node.js 20.9 or newer
- npm

Install and run:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add real credentials only to `.env` or `.env.local`; both are ignored by Git. Never put secrets in `.env.example`.

Available checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Shared Zod schemas and inferred TypeScript types live in `src/lib/schemas/`. UI work should use these contracts or typed fixtures derived from them.

The replaceable five-person group lives in `src/lib/data/demo-group.ts`. Contract-valid menu, compatibility, recommendation, question, and progress fixtures live in `src/lib/fixtures/demo-analysis.ts`, so UI work can proceed independently of the live analysis route.

The server-only GPT-4o mini adapter lives in `src/lib/server/openai-menu-extraction.ts`. Its validation and single repair-attempt workflow is isolated in `src/lib/ai/menu-extraction.ts` so it can be tested without making API calls.

Bounded dish research is exposed through `src/lib/research/dish-research.ts` and instantiated with the server-only Tavily credential in `src/lib/server/tavily-research.ts`. Provider errors degrade to an unavailable result rather than aborting analysis.

Deterministic hard-restriction evaluation lives in `src/lib/compatibility/restrictions.ts`. It normalizes a bounded English/Indonesian ingredient vocabulary, preserves evidence IDs, and applies conflict/confirmation/information precedence independently from preference scoring.

The research planner in `src/lib/research/research-planner.ts` offers GPT-4o mini only dishes with material hard-restriction uncertainty, then enforces a maximum of three researched dishes and two searches per dish in application code.

Research evidence normalization lives in `src/lib/research/evidence-normalizer.ts`. It accepts claims only for exact Tavily source URLs, labels them as common usage, preserves menu-listed evidence, and emits unresolved evidence when research or normalization fails.

Preference evaluation in `src/lib/compatibility/preferences.ts` receives no dietary restrictions, validates every explanation basis, and combines its score with the independently computed hard status without allowing the score to change that status.

The live matrix uses one batch preference request for all member/dish pairs. Missing, duplicated, invented, or invalid model cells fall back independently to deterministic preference estimates, so the matrix remains complete without multiplying model calls.

Group and per-member ranking lives in `src/lib/compatibility/recommendations.ts`. It rejects incomplete matrices, excludes conflicts from member fallbacks, and ranks group candidates by conflicts, confirmation burden, evidence sufficiency, then preference fit.

Material restaurant questions are generated through `src/lib/questions/restaurant-questions.ts`. Non-English menus receive English and detected-language text, English menus avoid duplicate translations, and invalid model references fall back to bounded questions derived from known uncertainties.

The complete server workflow is coordinated in `src/lib/analysis/analyze-menu.ts` and exposed as a newline-delimited JSON stream at `POST /api/analyze`. It emits only real high-level stages, runs independent dish research concurrently, preserves unresolved evidence when Tavily is unavailable, and validates the final result before streaming it to the client.

The endpoint accepts multipart fields `image` (JPEG, PNG, or WebP; maximum 8 MB) and `profile` (the JSON questionnaire profile). It returns NDJSON stage/result records and contract-valid safe error records. A lightweight per-instance throttle allows five analysis attempts per client per minute; it is intended only for this time-boxed demo.

## Locked prototype scope

- English, responsive group-only web experience
- Browser-stored questionnaire profile for the current user
- Existing demo group with source-controlled member profiles
- Menu image understanding with `gpt-4o-mini`; no separate OCR service
- Bounded agentic research with Tavily
- Direct TypeScript orchestration with OpenAI SDK, Tavily SDK, and Zod; no LangChain
- Deterministic hard-restriction checks separated from preference matching
- Group compatibility matrix, shared recommendation, individual fallbacks, and bilingual restaurant questions
- No authentication, database, invitations, sharing, or safety guarantees

## Source of truth

Read these in order before planning or implementation:

1. [`codex_project_context_food_compatibility_ai.md`](./codex_project_context_food_compatibility_ai.md)
2. [`openspec/changes/build-menukita-group-demo/proposal.md`](./openspec/changes/build-menukita-group-demo/proposal.md)
3. [`openspec/changes/build-menukita-group-demo/specs/`](./openspec/changes/build-menukita-group-demo/specs/)
4. [`openspec/changes/build-menukita-group-demo/design.md`](./openspec/changes/build-menukita-group-demo/design.md)
5. [`openspec/changes/build-menukita-group-demo/tasks.md`](./openspec/changes/build-menukita-group-demo/tasks.md)

The active OpenSpec change is authoritative if older exploratory context conflicts with it.

## OpenSpec collaboration

OpenSpec is the mandatory shared agreement layer for humans and coding agents. **Every repository update must be covered by an active OpenSpec change before files are edited**, including code, documentation, configuration, dependencies, generated files, formatting, and urgent fixes.

### Required workflow

1. **Before editing:** run `openspec list --json`, identify the governing change, and read its artifacts. If no change covers the work, create one first.
2. **Before implementing:** ensure every intended edit maps to a checkbox task in that change.
3. **During work:** update proposal, requirements, design, risks, and tasks whenever decisions or scope change. Do not leave decisions only in chat.
4. **After each task:** verify its outcome, then mark its checkbox complete.
5. **Before completion or sync:** run strict validation and confirm task status is accurate.
6. **After acceptance:** archive the completed change and verify its specs are synchronized.

```bash
openspec list --json
openspec status --change build-menukita-group-demo
openspec validate build-menukita-group-demo --strict
```

Example collaboration checkpoint:

```text
Governing change: openspec/changes/build-menukita-group-demo/
Current tasks: openspec/changes/build-menukita-group-demo/tasks.md
Validation: openspec validate build-menukita-group-demo --strict
```

In a Codex chat, use the generated OpenSpec skills to explore requirements, propose a change, apply approved tasks, and archive completed changes.

GitHub issues, feature branches, and pull requests are optional for this hackathon. For speed, collaborators can synchronize small validated updates directly. Pull before editing, keep commits focused, and coordinate edits to shared schemas, routing, dependencies, and OpenSpec artifacts. Use a branch or review only when concurrent work or risk makes it useful.

The full normative policy is defined by [`AGENTS.md`](./AGENTS.md) and the [`openspec-change-governance` specification](./openspec/changes/enforce-openspec-change-tracking/specs/openspec-change-governance/spec.md).

## Current collaboration inputs

- Moomina's onboarding, group, upload, navigation, and partial fixture-backed results UI are merged; live API progress/results integration and the final presentation pass remain.
- The five-member demo group is approved; Wildan will provide primary/backup demo menu images and the team can add final avatar assets later.
- The implementation task list deliberately isolates those inputs from domain and agent architecture.

### Suggested parallel ownership

| Area | Primary owner | OpenSpec tasks |
| --- | --- | --- |
| Brand system, responsive UI, and interaction states | Moomina | 2.2–2.4, 3.1, 6.1–6.4, 7.1 |
| Schemas, OpenAI/Tavily orchestration, and compatibility rules | Wildan | 1.2–1.3, 3.2–5.4 |
| Integration, verification, and demo preparation | Shared | 7.2–7.5 |

The UI can be developed against typed fixtures that match the shared Zod contracts. Coordinate changes to those contracts before either side updates dependent code.

## Secrets

Implementation will require server-only environment variables:

```text
OPENAI_API_KEY=
TAVILY_API_KEY=
```

Never commit credentials or expose them to browser code.
