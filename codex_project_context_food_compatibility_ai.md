# MenuKita Project Context: AI Food Compatibility Assistant

Use this file as the source of truth when discussing, planning, and developing the hackathon prototype. Do not assume every idea below must be implemented. Protect the one-day scope and prioritize a reliable end-to-end demo.

## Locked MVP decisions

These decisions supersede earlier exploratory alternatives elsewhere in this document:

- The product name is **MenuKita**.
- The demo is group-only; personal mode is a future extension.
- The current user completes an onboarding questionnaire stored in the browser.
- The user joins one existing demo group whose other profiles are hardcoded in source.
- Authentication, databases, invitations, sharing, and persistent group management are excluded.
- The interface language is English.
- `gpt-4o-mini` reads the menu image and returns structured data; no separate OCR service is used.
- Tavily supplies bounded web research when material dish information is missing.
- The agent uses explicit TypeScript orchestration with the OpenAI and Tavily SDKs, Zod validation, and deterministic restriction rules; LangChain is not used.
- The active OpenSpec change at `openspec/changes/build-menukita-group-demo/` is authoritative for implementation behavior, design, and tasks.
- Final preset group details, brand system, and demo images will be supplied before their corresponding implementation tasks.

## 1. Project status

- The idea has been discussed and agreed upon by Wildan and Moomina, who will be hackathon partners.
- This is a one-day, open-track hackathon at an international AI Summer Camp.
- The main goal is to build a useful and polished prototype that solves a real user problem.
- Novelty is not the main requirement. It is acceptable to improve an existing type of solution.
- AI should have a meaningful role, but the team should avoid adding unnecessary technical complexity just to show off technology.
- The final application must be deployable as a web app.

## 2. Product name

The final product name is **MenuKita**.

Working tagline:

> Find the dishes that match you.

Alternative product description:

> An AI food compatibility assistant that helps individuals and groups understand unfamiliar menus and choose food that fits their dietary restrictions and preferences.

## 3. Origin of the problem

The idea came directly from the team's experience at the AI Summer Camp. The participants come from different countries and have different dietary needs and food preferences.

Examples:

- Madhoo is vegan and cannot eat meat.
- Harsh does not eat beef.
- Other participants may need halal food, dislike certain ingredients, avoid very spicy food, prefer savory food, or have allergies.

When the group visits a restaurant or orders food, one person often has to:

1. Translate unfamiliar local dish names.
2. Explain what each dish is and how it is cooked.
3. Guess which ingredients are commonly used.
4. Ask everyone for their restrictions and preferences.
5. Find options that work for each person or the whole group.
6. Repeat the process when an item is unavailable.

This can lead to slow decisions, incorrect assumptions, unsuitable orders, and people receiving food they do not enjoy.

The summer camp is the origin story, not the entire market.

## 4. Core problem

People often struggle to determine whether an unfamiliar dish matches their dietary restrictions and personal preferences, especially when the menu is written in another language or does not explain the ingredients clearly.

Translation alone is not enough. A literal translation may not explain:

- Common ingredients
- Possible hidden ingredients
- Cooking method
- Flavor profile
- Spice level
- Texture
- Religious or dietary conflicts
- Questions that still need to be asked

## 5. Use cases

The product should support two modes conceptually.

### Personal mode

One user creates a food profile and scans a menu to find suitable dishes.

Potential users:

- Solo travelers
- International students
- Expats
- Muslim travelers
- Vegans and vegetarians
- People with food allergies or intolerances
- Picky eaters
- People exploring an unfamiliar cuisine, even in their own country

### Group mode

Several profiles are compared with the same menu. The app identifies options for each person and, when possible, options that work for the whole group.

Potential users:

- Friends with different diets
- Families
- International travel groups
- Camp and conference participants
- Event organizers choosing catering
- Teams ordering shared meals

### Product strategy

Group mode is the hackathon MVP because multi-person matching is the clearest differentiator. Personal mode remains a future extension. The prototype avoids group infrastructure by combining the questionnaire profile of the current user with preset members from one existing demo group.

## 6. Core solution

The user creates a food profile, uploads a photo or screenshot of a restaurant menu, and receives an evidence-aware compatibility analysis for each dish.

The application should:

1. Read the menu image.
2. Detect and translate the menu language when necessary.
3. Extract dish names, descriptions, and prices.
4. Explain unfamiliar dishes in simple language.
5. Identify ingredients explicitly listed by the restaurant.
6. Research common ingredients and cooking methods when menu information is incomplete.
7. Compare each dish with dietary restrictions and preferences.
8. Separate confirmed conflicts from uncertain possibilities.
9. Recommend suitable options.
10. Generate questions for the restaurant when important information cannot be confirmed.
11. Translate those questions into the restaurant's language when possible.

## 7. Important product distinction

The application must not claim that it knows a restaurant's exact recipe from a menu photo.

The AI can know or infer information from different sources, and the UI must show the difference:

### A. Listed on the menu

Information directly visible in the menu or official restaurant description.

Example:

> The menu explicitly lists peanuts.

### B. Commonly used

Information found in general sources about the dish or regional cuisine. This is not confirmation of the restaurant's recipe.

Example:

> Fish sauce is commonly used in Thai green curry.

### C. Needs confirmation

Information that remains unknown, varies between restaurants, or involves preparation and cross-contamination.

Example:

> The menu does not state whether the frying oil is shared with meat products.

The safe wording is:

> No conflict was found in the available information.

Do not say:

> This dish is definitely safe.

## 8. Food profile model

Separate restrictions from preferences.

### Hard restrictions

These can disqualify a dish or require confirmation:

- Allergens
- Vegan or vegetarian requirements
- Halal requirement
- No beef, pork, seafood, dairy, eggs, gluten, nuts, or other ingredients
- Medical or religious restrictions

### Soft preferences

These affect recommendation quality but should not be treated as safety restrictions:

- Spice tolerance
- Sweet versus savory preference
- Favorite ingredients
- Disliked ingredients
- Preferred texture
- Preferred cooking method
- Soup, grilled, fried, or dry food preference

An allergy must never be treated as equivalent to simply disliking an ingredient.

## 9. Recommended result model

Do not rely only on a single percentage score. A high score could hide an important dietary conflict.

Each dish should have two separate outputs:

### Dietary status

- `conflict_found`
- `likely_compatible`
- `needs_confirmation`
- `insufficient_information`

### Preference match

- A score from 0 to 100, or a simple low/medium/high match
- A short explanation of why the user may or may not enjoy the dish

Example:

```json
{
  "dishName": "Thai Green Curry",
  "translatedName": "Thai Green Curry",
  "dietaryStatus": "needs_confirmation",
  "preferenceScore": 86,
  "summary": "The creamy and savory flavor matches your preferences, but the dish may be spicier than you prefer.",
  "listedIngredients": ["coconut milk", "vegetables"],
  "commonIngredients": ["green chili", "fish sauce", "shrimp paste"],
  "conflicts": [],
  "uncertainties": ["fish sauce", "shrimp paste"],
  "questions": [
    "Does this dish contain fish sauce or shrimp paste?"
  ],
  "sourceNotes": [
    "Coconut milk and vegetables were listed on the menu.",
    "Fish sauce and shrimp paste are commonly used but were not confirmed by the restaurant."
  ]
}
```

## 10. Agentic AI behavior

The application may be described as agentic because the model can decide when additional information is needed and invoke a search capability.

Keep the agent flow controlled and predictable:

1. Extract menu information from the image.
2. Determine whether the menu provides enough information.
3. If information is incomplete, search for:
   - An official restaurant page or published menu, if available
   - General information about the dish
   - Common regional ingredients and cooking methods
4. Record which information came from which category.
5. Stop searching after a small, predefined number of attempts.
6. Mark unresolved information as uncertain.
7. Generate restaurant questions rather than inventing an answer.

Avoid an uncontrolled autonomous loop. A simple tool-calling workflow is sufficient for the hackathon.

Suggested functions:

```text
extract_menu(image)
research_dish(dish_name, restaurant_name?, country_or_language?)
evaluate_compatibility(dish_profile, food_profile)
generate_restaurant_questions(uncertainties, target_language)
```

## 11. One-day MVP

### Must have

- Responsive web interface
- Current-user onboarding questionnaire
- Existing demo-group selection and group overview
- Menu image upload
- Vision model extraction into structured JSON
- Explanation of each detected dish
- Hard-restriction status
- Preference match result
- Clear uncertainty labels
- At least one recommended dish
- Generated restaurant questions when necessary
- Group compatibility matrix and group/per-member recommendations
- A polished demo using a real menu screenshot

### Should have if time allows

- Translation of restaurant questions into the detected menu language
- Share or copy result
- Local scan history

### Explicit non-goals for the hackathon

- Training or fine-tuning a custom model
- Scraping hundreds of websites in advance
- Building a large knowledge base
- Vector database or embedding pipeline
- Direct GoFood, GrabFood, or restaurant POS integration
- Payment processing
- Native mobile application
- Guaranteed allergy or halal certification
- Perfect support for every language and cuisine
- Complex authentication and user management

## 12. Suggested technical approach

Prefer the simplest stack that Wildan can build and deploy quickly:

- Next.js with TypeScript
- App Router
- Tailwind CSS and optionally shadcn/ui
- A vision-capable multimodal model with structured JSON output
- A web search or grounding tool for missing dish information
- Deterministic TypeScript rules for hard-restriction matching
- Local state or `localStorage` for the first prototype
- Vercel deployment

Do not introduce a database unless it materially helps the demo. If caching is needed, a simple dish cache is enough. A vector database is unnecessary.

Suggested high-level architecture:

```text
Menu image
  -> vision extraction
  -> normalized dish list
  -> optional research for incomplete dishes
  -> evidence-aware dish profiles
  -> deterministic restriction matching
  -> AI-assisted preference explanation
  -> recommendation and restaurant questions
```

## 13. UX proposal

Keep the main journey short.

### Screen 1: Current-user questionnaire

- Add restrictions
- Add allergies
- Set spice tolerance
- Add likes and dislikes
- Optional preferred language

### Screen 2: Select and enter demo group

- Show the existing group card
- Join without authentication
- Review the current user and preset members
- Continue to menu scan

### Screen 3: Scan the menu

- Upload, drag and drop, or use camera
- Show image preview
- Allow optional restaurant name and country
- Analyze button

### Screen 4: Analysis

- Detected menu language
- Recommended dishes first
- Dish cards with dietary status and preference match
- Expandable evidence: listed, commonly used, needs confirmation
- Clear conflict and uncertainty explanations

### Screen 5: Ask the restaurant

- Generated confirmation questions
- Original user language
- Local restaurant language
- Copy button

### Group compatibility view

A matrix showing how each dish matches each person:

| Dish | Madhoo | Harsh | Wildan |
| --- | --- | --- | --- |
| Beef curry | Conflict | Conflict | Possible match |
| Chicken curry | Conflict | Match | Match |
| Vegetable curry | Needs confirmation | Match | Match |

## 14. Demo story

Use a realistic story from the summer camp:

1. Madhoo is vegan.
2. Harsh does not eat beef.
3. Wildan requires halal food and prefers savory food that is not extremely spicy.
4. The group uploads a photo of an unfamiliar local menu.
5. The app extracts and explains the dishes.
6. It identifies obvious conflicts.
7. It finds a dish that appears compatible with the group but has one uncertain ingredient.
8. It generates a question for the restaurant in the local language.
9. The group receives a clear recommendation without manually researching every menu item.

## 15. Success criteria

The prototype is successful if the demo clearly shows that:

- A real menu image can be converted into structured dishes.
- The same dish produces different results for different profiles.
- Hard restrictions are separated from preferences.
- The system admits uncertainty instead of hallucinating certainty.
- The agent searches only when necessary.
- The final recommendation is understandable without technical explanation.
- The deployed experience works from start to finish.

## 16. Risks to handle

### Hallucinated ingredients

Mitigation: distinguish listed ingredients, common ingredients, and unknowns.

### Unsafe claims

Mitigation: never guarantee food safety; tell users to confirm severe allergies, halal certification, and cross-contamination with the restaurant.

### Poor menu image quality

Mitigation: show extracted text and allow correction or re-upload.

### Slow or unreliable web research

Mitigation: cap searches, cache the demo result, and prepare a fallback demo input.

### Too many features for one day

Mitigation: keep group profiles preset, store only the current questionnaire profile in the browser, and exclude authentication, databases, invitations, sharing, and group administration.

### Generic product positioning

Mitigation: emphasize evidence-aware compatibility, personal preferences beyond allergies, restaurant question generation, and multi-person matching.

## 17. Product positioning

Do not position the product only as a menu translator or allergen detector.

Preferred positioning:

> An AI food compatibility assistant for unfamiliar menus.

Short pitch:

> Tell us what you can and cannot eat, then scan any unfamiliar menu. The AI explains the dishes, researches common ingredients, checks them against your profile, and tells you what to order or what to confirm with the restaurant.

Group extension:

> When dining together, the app compares the same menu with everyone's profile and helps the group find options that work for each person.

## 18. Guidance for Codex

When this context is first loaded:

1. Do not immediately build the entire application.
2. Inspect the current repository and existing files first.
3. Treat MenuKita, GPT-4o mini, Tavily, and direct TypeScript orchestration as locked unless Wildan explicitly changes them.
4. Propose a tightly scoped implementation plan for a one-day prototype.
5. Prioritize the end-to-end group demo flow defined by the active OpenSpec change.
6. Use structured model outputs and deterministic rules where possible.
7. Keep all safety and uncertainty wording visible in the interface.
8. Avoid overengineering and protect the demo timeline.
9. After the plan is approved, implement, test with at least one real menu image, deploy if authorized, and document the demo flow.

## 19. Remaining project inputs

Core concept and architecture decisions are locked in OpenSpec. The remaining inputs are:

- Final preset group-member details
- Final visual direction and brand system from the design collaborator
- Primary and backup menu images for the final demo
