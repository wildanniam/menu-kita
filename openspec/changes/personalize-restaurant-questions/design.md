## Context

The current generator creates one candidate per dish by merging every affected member's restrictions and uncertainties. The final question carries multiple member IDs, so member filtering works, but the text can combine unrelated concerns and feel generic. The results component also renders an empty question card when a member has no generated questions.

The compatibility matrix already contains the authoritative member-and-dish hard status, triggered restrictions, and uncertainties. The analysis input already contains the matching profiles and names, so personalization does not require another provider call or a new data source.

## Goals / Non-Goals

**Goals:**

- Create one question candidate for each material member-and-dish uncertainty.
- Give the model the affected member's ID, name, restriction context, and unresolved facts.
- Validate model output against the exact candidate identity and fall back deterministically when output is invalid or unavailable.
- Hide the question section for a selected member when that member has no material confirmations.
- Preserve grouped access to all remaining questions in the `All` view.

**Non-Goals:**

- Asking about preferences, compatible rows, already-confirmed conflicts, or non-material information gaps.
- Adding free-form chat, follow-up questioning, restaurant certification lookup, or another AI call.
- Claiming a dish is safe merely because no question was generated.

## Decisions

### Generate candidates per compatibility row

Each `needs_confirmation` row with at least one uncertainty becomes a candidate keyed by a deterministic `candidateId` composed from dish and member IDs. This keeps restrictions isolated and prevents one member's halal concern from being merged with another member's allergy or vegan concern. Aggregating by dish was rejected because it produced the generic wording reported in the current UI.

### Pass profiles into the question generator

`generateRestaurantQuestions` receives the same validated profiles used for compatibility evaluation. A candidate includes the member name for natural wording while the final contract continues to use a singleton `memberIds` array, preserving existing selectors and recommendation linking.

### Validate by candidate identity

Model drafts must return the supplied `candidateId`, dish ID, and member ID. Unknown or mismatched references are discarded per candidate and replaced with a bounded deterministic question. This prevents the model from assigning a restriction to the wrong person.

### Personalize without oversharing

Questions can identify the member by first/display name and describe only the supplied triggered restrictions and uncertainties for that candidate. They must remain concise, restaurant-facing, and bilingual under the existing language rules.

### Omit empty member sections

The results page renders `Ask the restaurant` only when the active member has one or more associated questions. The absence of the card means no material unresolved hard-restriction question was generated; the existing safety notice remains visible.

## Risks / Trade-offs

- [More questions in the `All` view when several members share one uncertainty] → Keep each question attributable and render the member name; correctness and personalization take priority over aggressive deduplication.
- [Model wording mentions a member unnecessarily] → Require concise phrasing and keep deterministic fallback wording bounded to the member name, dish, and supplied facts.
- [Old fixture/model output lacks candidate identity] → Update fixtures and tests together; invalid provider output safely falls back per candidate.
- [No question could be misread as a safety guarantee] → Retain the global guidance notice and document that omission only means no material unresolved question was generated.
