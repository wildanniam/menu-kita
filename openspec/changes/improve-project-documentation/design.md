## Context

The current README accurately records many implementation details but places setup first and spreads the product story, architecture, feature evidence, and safety boundary across long paragraphs. The `stellar-garden` reference demonstrates a clearer public-repository hierarchy: concise hero, evidence, overview, flow, architecture, stack, structure, setup, tests, deployment, troubleshooting, safety, and license.

MenuKita is not a blockchain project. Its documentation must translate that hierarchy into an AI-assisted food compatibility product and avoid blockchain concepts, proof claims, or infrastructure that do not exist here. All claims must be verified against the current Next.js codebase and package metadata.

## Goals / Non-Goals

**Goals:**

- Let judges understand the problem, differentiator, and working demo journey within the first screen of the README.
- Give collaborators accurate setup, environment, architecture, testing, and OpenSpec workflow instructions.
- Make the OpenAI/Tavily pipeline and evidence provenance understandable without overstating safety.
- Add an explicit MIT license in standard form and declare it in package metadata.

**Non-Goals:**

- Copying blockchain-specific sections, badges, contract evidence, wallet flows, or terminology from the reference.
- Adding unverified screenshots, test coverage percentages, contributors, awards, production guarantees, or provider claims.
- Changing the application, deployment, dependencies, or secrets.

## Decisions

### Reuse information hierarchy, not domain content

The README will follow the useful ordering from the reference while every heading and paragraph is rewritten for MenuKita. A direct copy was rejected because it would misrepresent the product and make the repository look templated.

### Lead with the demo story and evidence boundary

The opening sections will explain the group problem, the four-step flow, live demo, implemented capabilities, and the distinction between menu-listed, common-usage, and unresolved evidence. This gives judges the product value before implementation details.

### Use text architecture grounded in current modules

The architecture diagram will describe browser UI and storage, the Next.js NDJSON endpoint, GPT-4o mini, Tavily, deterministic rules, Zod validation, and the results UI. No external component will be shown unless it exists in the current implementation.

### Keep operational detail concise and navigable

Long internal explanations will be consolidated into feature, architecture, safety, and contributor sections with links to the deeper project context and OpenSpec artifacts. Setup commands and environment variable names remain explicit.

### Adopt MIT license consistently

Add the standard MIT text with the 2026 Wildan Syukri Niam copyright line, link it from the README, and set `package.json`'s `license` field to `MIT`.

## Risks / Trade-offs

- [README becomes too long for quick review] → Use a compact table of contents, tables, lists, and progressive detail.
- [Documentation drifts from implementation] → Ground version, script, route, provider, and test claims in the repository and describe OpenSpec as the update mechanism.
- [Safety copy sounds like legal assurance] → State explicitly that MenuKita provides guidance, not allergy, halal, recipe, or cross-contamination certification.
- [Live demo environment is unavailable] → Present the URL as a demo link without claiming uptime or production readiness.
