## Context

MenuKita is a greenfield, one-day hackathon prototype for an international audience. It must demonstrate a real end-to-end group flow and a bounded agentic research process while remaining reliable enough for a live demo. Preset member values and visual direction must remain isolated from core logic.

## Goals / Non-Goals

**Goals:**

- Deliver an English responsive flow from onboarding through actionable group recommendations.
- Make multimodal extraction, selective research, provenance, and uncertainty observable.
- Keep hard-restriction decisions deterministic wherever the evidence is explicit.
- Make preset profiles and visual styling easy to replace without changing the workflow.
- Fail gracefully when image extraction or web research is incomplete.

**Non-Goals:**

- Authentication, database persistence, group administration, invitations, or collaboration.
- Separate OCR infrastructure, custom model training, embeddings, or a food knowledge base.
- Guarantees concerning allergies, religious compliance, recipes, or cross-contamination.
- Broad cuisine coverage beyond what is required for the prepared demonstration.

## Decisions

### Application stack

Use Next.js App Router with TypeScript and Tailwind CSS. Keep the application as one deployable unit, use server-only route handlers for external APIs, and use browser storage only for the questionnaire profile. This minimizes infrastructure and matches the intended Vercel deployment. A separate backend and database were rejected because they add no value to the prototype story.

### Replaceable preset data

Store group metadata and preset member profiles in a typed source module. Add the questionnaire profile at runtime without mutating the preset object. This lets the team replace names and restrictions later without editing matching or UI logic.

The approved demo group contains five people total: the current user, Wildan, whose answers come from onboarding; Madhoolika, who is vegan; Harsh, who does not eat beef; Moomina, who has a seafood allergy; and Victor, who is lactose intolerant. Store the latter four as preset members and use a Wildan sample profile only for fixture-driven development and tests. Profiles appear as normal members in the product; fixture provenance is an implementation concern, not a user-facing label.

### Structured contracts

Use Zod schemas as the boundary for model extraction, research synthesis, and final results. Preserve a stable dish ID and evidence records containing claim, type, source title, source URL, and whether the restaurant confirmed it. Invalid model output receives one controlled repair attempt; subsequent failure becomes a user-facing retry state.

### Sequential, observable orchestration

Implement explicit server-side orchestration rather than an autonomous loop:

1. GPT-4o mini extracts structured dishes from the uploaded image.
2. A research planner selects only potentially relevant dishes with material unknowns.
3. The server invokes Tavily with hard limits and returns source snippets.
4. GPT-4o mini normalizes researched claims and provenance.
5. TypeScript rules evaluate explicit hard conflicts; the model assists with semantic normalization and preferences.
6. The server ranks group and per-member candidates and generates bilingual questions.

Expose only these high-level stages to the client. Do not expose chain-of-thought. Use one streaming `POST /api/analyze` route with newline-delimited JSON events so the client receives real stage transitions and one final validated result without coordinating several public endpoints. The event union contains stage, result, and safe error records. If streaming cannot be completed reliably, fall back to one honest active-analysis state rather than fabricated fine-grained progress.

### Direct orchestration without an agent framework

Implement the bounded agent as explicit TypeScript functions using the OpenAI SDK, Tavily SDK, and Zod rather than LangChain or another agent framework. The model retains agentic decisions—whether research is required, which dishes to research, what to query, whether evidence is relevant, and when to stop—while application code enforces budgets and deterministic safety rules. LangChain was rejected because this prototype has one external tool and a short, controlled chain; its abstractions would increase dependency and debugging cost without adding useful capability.

### Bounded Tavily adapter

Wrap Tavily behind a `DishResearchProvider` interface so the agent calls a domain function rather than vendor code. Use `search_depth: basic`, `max_results: 3`, `include_answer: false`, and no raw content. Research at most three dishes and at most twice per dish, with a short timeout. Prioritize an official restaurant query, then one general dish query. Failed research returns an unresolved evidence result instead of failing the scan.

### Compatibility precedence

Normalize common ingredient aliases before applying deterministic member rules. Status precedence is:

1. Explicit hard conflict → `conflict`.
2. Possible hard conflict or material unknown → `needs_confirmation`.
3. Evidence too sparse for evaluation → `insufficient_information`.
4. Adequate evidence with no known conflict → `compatible`.

Preference scoring is calculated separately and cannot change that status. Group ranking first minimizes conflicts and confirmation burden, then considers aggregated preference fit.

Evaluate preference fit for the complete member/dish matrix in one structured model request rather than one request per cell. Application code validates profile IDs, dish IDs, and explanation evidence references, then fills any missing or invalid cell with a deterministic preference estimate. Hard-restriction status is always computed separately after preference output is received.

The deterministic baseline recognizes the demo group's vegan, no-beef, seafood-allergy, lactose-intolerance, and halal requirements plus common no-pork, vegetarian, shellfish, egg, gluten, nut, sesame, and soy inputs. Keep the alias vocabulary deliberately bounded to common English and Indonesian menu terms. Plant milks such as coconut milk must not be treated as dairy. An unrecognized hard requirement must produce `needs_confirmation` rather than silently passing as compatible. For halal profiles, explicitly listed pork or alcohol is a conflict, while unconfirmed meat sourcing or preparation requires confirmation.

### Security and data handling

Keep `OPENAI_API_KEY` and `TAVILY_API_KEY` in server-only environment variables. Validate file type and size before forwarding an image, validate all request bodies, avoid logging profile/image content, and add basic request limits suitable for a public demo deployment.

### Demo resilience

Use a prepared clear image and keep a second image available outside the application. Add retry and reset paths, retain extraction when Tavily fails, and test the exact demo profiles/menu before presentation. Do not ship hardcoded analysis output disguised as a live result.

### Fixture-first UI collaboration

Provide source-controlled fixtures that satisfy the shared Zod contracts for preset profiles, extracted dishes, evidence, compatibility results, recommendations, questions, and stage events. Moomina can build presentation components against these fixtures while core integrations are developed independently. Fixtures must be clearly labeled as development data and replaced by the live `/api/analyze` response during integration; they must never be presented as a successful live analysis.

Keep the approved group values in one typed data module so replacing restrictions, preferences, or avatars does not change UI or agent logic.

## Development Execution Plan

### Current baseline

- Next.js, TypeScript, Tailwind CSS, linting, tests, and production build are operational.
- OpenAI and Tavily credentials are present locally and authentication smoke checks pass.
- Server environment validation, shared Zod contracts, typed fixtures, and preset group data are implemented.
- Structured GPT-4o mini extraction, bounded Tavily research and evidence normalization, deterministic hard-restriction evaluation, batch preference evaluation, recommendation ranking, and bilingual material-question generation are connected through the streamed `/api/analyze` route and unit-tested.
- The route emits newline-delimited validated stage events only when work actually occurs, followed by one validated result. Independent dishes research concurrently, queries for a single dish remain sequential, and provider failures become unresolved evidence without aborting the scan.
- No onboarding, group flow, upload flow, live analysis route, results UI, or deployment exists yet.

### Delivery graph

```text
Foundation + contracts (complete)
             |
      Typed fixtures
       /           \
UI flow             Core agent
(Moomina)            (Wildan)
       \           /
       Live integration
              |
      Demo QA + brand pass
              |
       Authorized deploy
```

### Wave 1 — unblock parallel work

- Core: add the typed preset group and complete analysis/stage fixtures.
- UI: build onboarding, group selection/overview, upload, progress, and result screens against fixtures.
- Integration contract: UI imports shared schemas/types and consumes the same event/result shapes as the future route.
- Exit gate: all planned screens can be navigated using fixtures; contracts parse successfully; no brand-specific decisions are required.

### Suggested task ownership

| Workstream | Primary owner | OpenSpec tasks |
| --- | --- | --- |
| Shared fixtures and preset group data | Wildan | 1.4, 2.1 |
| Onboarding, group, upload, and result presentation | Moomina | 2.2–2.4, 3.1, 6.1–6.2, 6.4, 7.1 |
| OpenAI extraction and Tavily research | Wildan | 3.2–4.4 |
| Compatibility, ranking, and generated questions | Wildan | 5.1–5.4, 6.3 |
| Security, integration tests, and automated checks | Wildan | 7.2–7.4 |
| Menu QA, avatar/brand pass, and deployment decision | Shared | 7.5–7.6 |

Wildan owns shared contract changes after Wave 1. Moomina should raise UI-driven contract needs in OpenSpec before either side changes schemas, preventing parallel edits from silently diverging.

### Wave 2 — prove risky integrations

- Implement GPT-4o mini image extraction with structured output and one repair attempt.
- Implement the bounded Tavily adapter and provenance normalization.
- Implement deterministic restriction precedence and unit tests before AI-assisted preference explanations.
- Exit gate: one clear test menu produces validated dishes and sourced research; Tavily failure degrades to unresolved evidence instead of failing the scan.

### Wave 3 — assemble the bounded agent

- Let GPT-4o mini select material research needs within application limits.
- Run independent Tavily searches concurrently where safe.
- Normalize evidence, enforce deterministic hard conflicts, calculate preferences, rank recommendations, and generate bilingual questions.
- Stream truthful stage events and the final result from `POST /api/analyze`.
- Exit gate: a real scan completes end to end and never lets preference scores override a hard conflict.

### Wave 4 — integrate and harden

- Replace UI fixture transport with the live streamed route while retaining fixtures for deterministic tests.
- Add upload limits, safe errors, timeout behavior, basic throttling, reset/retry, and secret-exposure checks.
- Test mobile and desktop behavior; Moomina applies the final brand system without changing domain contracts.
- Exit gate: core paths and failure paths work in browser with no console errors and all automated checks pass.

### Wave 5 — demo readiness

- Confirm the approved profiles and add final avatar assets if available.
- Test primary and backup menu images and record expected outputs.
- Rehearse the story, confirmation question, fallback behavior, and no-shared-dish case.
- Deploy only after explicit authorization, configure production environment variables, and perform a production smoke test.

### Scope-cut order

If time becomes constrained, preserve the live personal-to-group scan and cut in this order:

1. Extra visual polish and nonessential motion.
2. Multiple group choices or member editing.
3. A second research attempt per dish.
4. Advanced preference explanations.

Do not cut evidence provenance, hard-restriction precedence, uncertainty wording, restaurant questions, or the real menu scan.

## Risks / Trade-offs

- [GPT-4o mini misreads decorative or small text] → Use a clear demo image, validate structured output, show uncertainty, and provide retry/reset.
- [Tavily adds latency or produces weak sources] → Bound searches, enforce timeouts, prefer official sources, and degrade to confirmation questions.
- [General recipes are mistaken for restaurant facts] → Preserve evidence types and use explicit non-confirmation wording throughout the UI.
- [Deterministic rules miss synonyms] → Normalize a deliberately small ingredient alias set and keep uncertain semantic matches as confirmation rather than compatibility.
- [Public endpoints consume API credits] → Keep keys server-side and add lightweight file/request/rate limits appropriate for the demo.
- [Avatar assets or visual design arrive late] → Isolate both as replaceable data and presentation concerns.

## Migration Plan

1. Scaffold the application and environment template without secrets.
2. Implement and verify the local flow using fixture data.
3. Integrate OpenAI image extraction, then Tavily research behind server-only adapters.
4. Test the exact demo image and profiles end to end.
5. Deploy to Vercel only after local verification and explicit authorization.

Rollback consists of reverting the deployment or disabling the deployed project; there is no persistent user data to migrate.

## Open Questions

- Final avatar assets for the preset group members; initials can be used until supplied.
- Final visual system supplied by the design collaborator; neutral fixture UI is approved meanwhile.
- Exact demo menu image and expected dish set for acceptance testing; this is required for Wave 5, not earlier development.
