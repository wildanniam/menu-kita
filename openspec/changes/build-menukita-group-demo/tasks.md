## Ownership and coordination

- **Wildan/Core** owns schemas, source data, OpenAI/Tavily orchestration, compatibility logic, API/security, and automated verification.
- **Moomina/UI** owns onboarding, group and upload journeys, results presentation, responsive interaction, and the visual system.
- **Shared** work requires both sides to coordinate inputs or approval before completion.
- Work can proceed in parallel. Pull before editing, stay within the labeled ownership area, and record any scope or contract change in this OpenSpec change before implementation.
- Wildan owns shared domain contracts after the fixture baseline. Moomina should record UI-driven contract needs in OpenSpec before changing shared schemas or fixture shapes.

## 1. Project foundation

- [x] 1.1 **[Wildan/Core]** Scaffold a Next.js App Router project with TypeScript, Tailwind CSS, linting, and test tooling
- [x] 1.2 **[Wildan/Core]** Add environment validation and an `.env.example` for server-only OpenAI and Tavily keys
- [x] 1.3 **[Wildan/Core]** Define Zod schemas and TypeScript types for profiles, groups, dishes, evidence, statuses, recommendations, and questions
- [x] 1.4 **[Wildan/Core]** Add contract-valid fixtures for preset group profiles, menu analysis results, and streamed stage events
- [x] 1.5 **[Wildan/Core]** Document the phased development plan, task ownership, integration gates, scope-cut order, and authorized deployment step

## 2. Profile and group journey

- [x] 2.1 **[Wildan/Core]** Add the replaceable preset group data module using the approved five-person group
- [x] 2.2 **[Moomina/UI]** Build the English onboarding questionnaire with validation and browser persistence
- [x] 2.3 **[Moomina/UI]** Build explicit existing-group selection and a group overview combining the current user with preset members
- [x] 2.4 **[Moomina/UI]** Add navigation, reset, and reload behavior for the complete pre-scan journey
  - Flow navigation now respects saved profile/result state, reload restores validated browser state, and Start over clears the profile and analysis before returning to onboarding.
- [x] 2.5 **[Moomina/UI]** Require an explicit spice-tolerance choice and show accessible validation instead of silently defaulting to spicy

## 3. Menu extraction

- [x] 3.1 **[Moomina/UI]** Build menu image selection, validation, preview, removal, and retry states
- [x] 3.2 **[Wildan/Core]** Implement the server-only OpenAI adapter and structured GPT-4o mini menu extraction
- [x] 3.3 **[Wildan/Core]** Validate extraction output, preserve unreadable fields, and add one controlled schema-repair attempt
- [x] 3.4 **[Wildan/Core]** Make provider-facing URL contracts compatible with OpenAI structured outputs, calibrate bounded deadlines against the dense menu, and regression-test live extraction
  - Live GPT-4o mini vision reads the supplied dense screenshot directly. Structured extraction completes in roughly 26 seconds after removing unsupported JSON Schema `uri` formats; provider and whole-route deadlines are now 45 and 150 seconds respectively.

## 4. Bounded agentic research

- [x] 4.1 **[Wildan/Core]** Implement the Tavily provider adapter with basic search, source normalization, timeout, and request limits
- [x] 4.2 **[Wildan/Core]** Implement the research planner that selects only material unknowns and enforces per-scan and per-dish limits
- [x] 4.3 **[Wildan/Core]** Implement researched-claim normalization with menu-listed, common-usage, and unresolved provenance
- [x] 4.4 **[Wildan/Core]** Connect extraction, planning, research, and synthesis into a streaming `POST /api/analyze` workflow with truthful stage events and graceful degradation

## 5. Compatibility and recommendations

- [x] 5.1 **[Wildan/Core]** Implement ingredient alias normalization and deterministic hard-restriction rules with status precedence
- [x] 5.2 **[Wildan/Core]** Implement separate preference evaluation and evidence-based member-dish explanations
- [x] 5.3 **[Wildan/Core]** Implement group ranking, best-for-everyone selection, and per-member fallback recommendations
- [x] 5.4 **[Wildan/Core]** Add unit tests for conflicts, possible conflicts, sparse evidence, preference separation, and ranking edge cases

## 6. Results and restaurant questions

- [x] 6.1 **[Moomina/UI]** Build responsive analysis progress using only actual workflow stages
- [x] 6.2 **[Moomina/UI]** Build the group recommendation summary and responsive compatibility matrix with expandable evidence
- [x] 6.3 **[Wildan/Core]** Generate material confirmation questions in English and the detected menu language
- [x] 6.4 **[Moomina/UI]** Build the question display, local-language copy action, uncertainty messaging, and safety disclaimer
- [x] 6.5 **[Shared]** Connect the scan UI to the streamed `/api/analyze` contract, persist the validated result for reload, and remove dummy result transport

## 7. Presentation and verification

- [x] 7.1 **[Moomina/UI]** Integrate the collaborator-provided visual direction and responsive interaction states without changing domain behavior
- [x] 7.2 **[Wildan/Core]** Add API input limits, safe error responses, basic request throttling, and checks preventing secret exposure
- [x] 7.3 **[Wildan/Core]** Add integration tests for questionnaire-to-group flow and agent fallback behavior using deterministic fixtures
- [x] 7.4 **[Wildan/Core]** Run lint, type checks, tests, production build, and browser checks across mobile and desktop widths
  - Final verification passes: lint, typecheck, 81 automated tests, production build, and browser journeys at 390×844 and desktop width with no application console errors.
  - Browser verification covered guarded navigation, analysis completion, expandable evidence, local-language copy, result persistence after reload, and Start over clearing both stored states. Exact provider-backed demo-image acceptance remains task 7.5.
- [ ] 7.5 **[Shared]** Verify the exact primary and backup menu images with the approved group profiles and document the live demo sequence and fallback plan
- [ ] 7.6 **[Shared]** After explicit authorization, configure Vercel environment variables, deploy, and smoke-test the production demo
- [x] 7.7 **[Wildan/Core]** Add bounded OpenAI and whole-analysis timeouts, cancellation propagation, Vercel route duration, and content-free stage timing logs
- [x] 7.8 **[Wildan/Core]** Re-run automated and browser checks for the corrected group journey, validation, cancellation, timeout, and responsive states
  - Browser checks cover visible name/spice validation, explicit preset-group join, reload persistence, manual-location ephemerality, allowed/denied geolocation, and upload availability after denial. Automated checks cover stream cancellation and timeout plumbing; exact live-provider menu acceptance remains task 7.5.
- [x] 7.9 **[Wildan/Core]** Add content-free failure classification and resolve dense-menu synthesis regressions found by live provider testing
  - The local streamed endpoint completed `reading_menu` → evidence checking → member matching → recommendation preparation → `complete` with a contract-valid five-member result. Failure logs retain only stage, elapsed time, provider classification, and schema paths.
