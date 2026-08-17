## Why

International groups struggle to choose food from unfamiliar menus when members have different dietary restrictions and preferences. MenuKita needs a focused hackathon prototype that demonstrates evidence-aware, agentic group matching end to end without spending limited build time on authentication, persistence, or group-sharing infrastructure.

## What Changes

- Add an English onboarding questionnaire that creates the current user's food profile for the browser session.
- Add selection and overview of an existing demo group whose other member profiles are defined in code.
- Add menu image upload and multimodal structured extraction using GPT-4o mini.
- Add a bounded sequential research workflow that uses Tavily only when important dish information is missing.
- Distinguish menu-listed facts, generally researched information, and facts that still require restaurant confirmation.
- Add deterministic hard-restriction evaluation and AI-assisted preference matching for every member and dish.
- Add group-wide and per-member recommendations, including an honest fallback when no dish works for everyone.
- Add restaurant confirmation questions in English and the detected menu language.
- Exclude authentication, databases, group creation/invitations, sharing, scan history, and guarantees of allergy or religious safety.

## Capabilities

### New Capabilities

- `profile-and-group-flow`: Onboarding the current user, selecting the preset group, and viewing the combined group profile.
- `agentic-menu-analysis`: Extracting menu content from an image and performing bounded Tavily research with explicit evidence provenance.
- `group-compatibility`: Evaluating dishes for each member and producing group and individual recommendations without hiding hard conflicts.
- `restaurant-questions`: Generating confirmation questions in English and the detected local menu language.

### Modified Capabilities

None.

## Impact

- Introduces a new responsive Next.js TypeScript web application and server-side API workflow.
- Adds OpenAI and Tavily SDK/API integrations, with both credentials restricted to the server.
- Adds browser-only state for the current user's questionnaire; preset group profiles remain source-controlled data.
- Requires structured schemas, deterministic matching rules, graceful failure states, and a prepared clear menu image for the demo.
