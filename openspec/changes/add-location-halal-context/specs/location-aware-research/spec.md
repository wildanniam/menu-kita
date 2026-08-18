## ADDED Requirements

### Requirement: Location-aware research planning
The system SHALL include an available coarse place in research candidates and fallback queries that investigate ingredients or preparation methods likely to vary by region.

#### Scenario: Place context is available
- **WHEN** a menu item has a material unknown and the request includes a coarse place
- **THEN** the research plan includes a compact place label in the relevant query

#### Scenario: Place context is absent
- **WHEN** no coarse place was supplied
- **THEN** research planning retains the existing non-localized behavior

### Requirement: Local evidence remains non-exact
The system MUST classify location-aware web results as `common_usage` evidence and MUST NOT claim that regional evidence proves the exact restaurant recipe.

#### Scenario: Regional source mentions a restricted ingredient
- **WHEN** localized research finds that a restricted ingredient is commonly used but the menu does not state it explicitly
- **THEN** the dish requires confirmation and presents a targeted question rather than claiming an exact ingredient conflict

#### Scenario: Research is sparse or unavailable
- **WHEN** localized research cannot establish useful ingredient evidence
- **THEN** the system returns insufficient-information guidance and does not invent a local recipe

### Requirement: Certification absence is not a dish signal
The system MUST NOT infer halal incompatibility from a missing certification check or the absence of restaurant-level certification data.

#### Scenario: No certification information
- **WHEN** a halal profile is analyzed without explicit pork, lard, alcohol, or relevant common-usage evidence
- **THEN** certification absence alone does not create a conflict or confirmation flag
