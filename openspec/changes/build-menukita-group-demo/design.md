## Context

MenuKita is a greenfield, one-day hackathon prototype for an international audience. It must demonstrate a real end-to-end group flow and a bounded agentic research process while remaining reliable enough for a live demo. The repository currently contains only product context and OpenSpec artifacts. Final preset member values and visual direction will be supplied separately and must remain isolated from core logic.

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

Expose only these high-level stages to the client. Do not expose chain-of-thought. Prefer a streaming event response or discrete stage endpoint contract only if it can report real completed work; otherwise show the current server operation without fabricated fine-grained progress.

### Bounded Tavily adapter

Wrap Tavily behind a `DishResearchProvider` interface so the agent calls a domain function rather than vendor code. Use `search_depth: basic`, `max_results: 3`, `include_answer: false`, and no raw content. Research at most three dishes and at most twice per dish, with a short timeout. Prioritize an official restaurant query, then one general dish query. Failed research returns an unresolved evidence result instead of failing the scan.

### Compatibility precedence

Normalize common ingredient aliases before applying deterministic member rules. Status precedence is:

1. Explicit hard conflict → `conflict`.
2. Possible hard conflict or material unknown → `needs_confirmation`.
3. Evidence too sparse for evaluation → `insufficient_information`.
4. Adequate evidence with no known conflict → `compatible`.

Preference scoring is calculated separately and cannot change that status. Group ranking first minimizes conflicts and confirmation burden, then considers aggregated preference fit.

### Security and data handling

Keep `OPENAI_API_KEY` and `TAVILY_API_KEY` in server-only environment variables. Validate file type and size before forwarding an image, validate all request bodies, avoid logging profile/image content, and add basic request limits suitable for a public demo deployment.

### Demo resilience

Use a prepared clear image and keep a second image available outside the application. Add retry and reset paths, retain extraction when Tavily fails, and test the exact demo profiles/menu before presentation. Do not ship hardcoded analysis output disguised as a live result.

## Risks / Trade-offs

- [GPT-4o mini misreads decorative or small text] → Use a clear demo image, validate structured output, show uncertainty, and provide retry/reset.
- [Tavily adds latency or produces weak sources] → Bound searches, enforce timeouts, prefer official sources, and degrade to confirmation questions.
- [General recipes are mistaken for restaurant facts] → Preserve evidence types and use explicit non-confirmation wording throughout the UI.
- [Deterministic rules miss synonyms] → Normalize a deliberately small ingredient alias set and keep uncertain semantic matches as confirmation rather than compatibility.
- [Public endpoints consume API credits] → Keep keys server-side and add lightweight file/request/rate limits appropriate for the demo.
- [Final profiles or visual design arrive late] → Isolate both as replaceable data and presentation concerns.

## Migration Plan

1. Scaffold the application and environment template without secrets.
2. Implement and verify the local flow using fixture data.
3. Integrate OpenAI image extraction, then Tavily research behind server-only adapters.
4. Test the exact demo image and profiles end to end.
5. Deploy to Vercel only after local verification and explicit authorization.

Rollback consists of reverting the deployment or disabling the deployed project; there is no persistent user data to migrate.

## Open Questions

- Final values and avatars for the preset group members.
- Final visual system supplied by the design collaborator.
- Exact demo menu image and expected dish set for acceptance testing.
