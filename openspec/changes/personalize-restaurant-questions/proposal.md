## Why

Restaurant questions are currently filtered by member ID, but their wording and generation can still feel generic and a question section may appear even when the active member has no material uncertainty. The demo should make the agent's value obvious by asking only the specific confirmations that matter to each person's actual hard restrictions.

## What Changes

- Generate restaurant questions from unresolved member-and-dish hard-restriction facts, preserving the affected member IDs and restriction context.
- Prefer concise personalized wording that explains whose need is being protected without exposing unrelated member restrictions.
- Omit a member's question section when every material hard-restriction fact for that member is already resolved.
- Keep the `All` overview capable of grouping the remaining questions across affected members.
- Add regression coverage for personalized, shared, and no-question cases.

## Capabilities

### New Capabilities
- `personalized-restaurant-questions`: Defines member-specific question eligibility, wording, association, and omission behavior.

### Modified Capabilities

None.

## Impact

This affects restaurant-question generation and fallback logic, the question schema data consumed by results selectors, member-scoped result rendering, fixtures/tests, and collaboration documentation. It does not add a provider, dependency, route, or safety guarantee.
