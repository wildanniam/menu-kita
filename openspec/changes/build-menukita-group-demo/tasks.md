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
- [ ] 2.2 **[Moomina/UI]** Build the English onboarding questionnaire with validation and browser persistence
- [ ] 2.3 **[Moomina/UI]** Build existing-group selection and a group overview combining the current user with preset members
- [ ] 2.4 **[Moomina/UI]** Add navigation, reset, and reload behavior for the complete pre-scan journey

## 3. Menu extraction

- [ ] 3.1 **[Moomina/UI]** Build menu image selection, validation, preview, removal, and retry states
- [x] 3.2 **[Wildan/Core]** Implement the server-only OpenAI adapter and structured GPT-4o mini menu extraction
- [x] 3.3 **[Wildan/Core]** Validate extraction output, preserve unreadable fields, and add one controlled schema-repair attempt

## 4. Bounded agentic research

- [x] 4.1 **[Wildan/Core]** Implement the Tavily provider adapter with basic search, source normalization, timeout, and request limits
- [ ] 4.2 **[Wildan/Core]** Implement the research planner that selects only material unknowns and enforces per-scan and per-dish limits
- [ ] 4.3 **[Wildan/Core]** Implement researched-claim normalization with menu-listed, common-usage, and unresolved provenance
- [ ] 4.4 **[Wildan/Core]** Connect extraction, planning, research, and synthesis into a streaming `POST /api/analyze` workflow with truthful stage events and graceful degradation

## 5. Compatibility and recommendations

- [ ] 5.1 **[Wildan/Core]** Implement ingredient alias normalization and deterministic hard-restriction rules with status precedence
- [ ] 5.2 **[Wildan/Core]** Implement separate preference evaluation and evidence-based member-dish explanations
- [ ] 5.3 **[Wildan/Core]** Implement group ranking, best-for-everyone selection, and per-member fallback recommendations
- [ ] 5.4 **[Wildan/Core]** Add unit tests for conflicts, possible conflicts, sparse evidence, preference separation, and ranking edge cases

## 6. Results and restaurant questions

- [ ] 6.1 **[Moomina/UI]** Build responsive analysis progress using only actual workflow stages
- [ ] 6.2 **[Moomina/UI]** Build the group recommendation summary and responsive compatibility matrix with expandable evidence
- [ ] 6.3 **[Wildan/Core]** Generate material confirmation questions in English and the detected menu language
- [ ] 6.4 **[Moomina/UI]** Build the question display, local-language copy action, uncertainty messaging, and safety disclaimer

## 7. Presentation and verification

- [ ] 7.1 **[Moomina/UI]** Integrate the collaborator-provided visual direction and responsive interaction states without changing domain behavior
- [ ] 7.2 **[Wildan/Core]** Add API input limits, safe error responses, basic request throttling, and checks preventing secret exposure
- [ ] 7.3 **[Wildan/Core]** Add integration tests for questionnaire-to-group flow and agent fallback behavior using deterministic fixtures
- [ ] 7.4 **[Wildan/Core]** Run lint, type checks, tests, production build, and browser checks across mobile and desktop widths
- [ ] 7.5 **[Shared]** Verify the exact primary and backup menu images with the approved group profiles and document the live demo sequence and fallback plan
- [ ] 7.6 **[Shared]** After explicit authorization, configure Vercel environment variables, deploy, and smoke-test the production demo
