# MenuKita

MenuKita is an AI food compatibility assistant for groups navigating unfamiliar menus. A user completes a short food-profile questionnaire, joins a preset demo group, uploads a menu image, and receives evidence-aware recommendations for the whole group and each member.

This repository is currently in the specification phase. Application code has not been scaffolded yet.

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

OpenSpec is the shared agreement layer for humans and coding agents.

```bash
openspec list
openspec status --change build-menukita-group-demo
openspec validate build-menukita-group-demo --strict
```

In a Codex chat, use the generated OpenSpec skills to explore requirements, propose a separate change, apply approved tasks, and archive completed changes. Update the active artifacts when a product or technical decision changes; do not leave important decisions only in chat.

For parallel work, use separate branches and OpenSpec changes when scopes can be isolated. Coordinate edits to shared schemas, routing, and dependencies before implementation.

## Current collaboration inputs

- Moomina is researching the brand system and visual direction and is expected to lead UI presentation work.
- Wildan will provide final preset group profiles and primary/backup demo menu images.
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
