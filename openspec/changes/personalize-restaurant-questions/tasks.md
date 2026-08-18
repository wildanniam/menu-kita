## 1. Candidate and generation contract

- [x] 1.1 Add failing tests for per-member candidate isolation, personalized fallback wording, invalid member references, and already-clear members
- [x] 1.2 Refactor restaurant-question candidates and model drafts around deterministic member-and-dish candidate identities
- [x] 1.3 Pass validated profiles into question generation and update the OpenAI instructions for concise personalized bilingual wording

## 2. Results presentation

- [x] 2.1 Add selector and UI regression coverage for member filtering, member labels in `All`, and empty-section omission
- [x] 2.2 Render only non-empty member question sections and label each grouped question with its affected member

## 3. Verification and collaboration

- [x] 3.1 Update README and project context with the personalized question behavior and its safety boundary
- [x] 3.2 Run focused tests, lint, type checks, full tests, production build, and strict OpenSpec validation
