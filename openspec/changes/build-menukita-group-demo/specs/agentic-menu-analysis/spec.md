## ADDED Requirements

### Requirement: Menu image extraction
The system SHALL use a multimodal model to detect the menu language and extract visible dish names, descriptions, prices, and explicitly listed ingredients into validated structured data.

#### Scenario: Clear supported menu image
- **WHEN** the user submits a clear menu image
- **THEN** the system returns a normalized dish list while preserving original-language names and visibly listed facts

#### Scenario: Unreadable menu content
- **WHEN** part of the image cannot be read reliably
- **THEN** the system marks the affected content as unclear rather than inventing text

### Requirement: Evidence provenance
The system MUST classify every ingredient or preparation claim as menu-listed, researched common usage, or unresolved and MUST preserve source URLs for researched claims.

#### Scenario: Explicit menu ingredient
- **WHEN** an ingredient is visible in the menu description
- **THEN** the claim is classified as menu-listed and does not require an external source

#### Scenario: General recipe source
- **WHEN** research finds an ingredient commonly used in a dish
- **THEN** the claim is classified as researched common usage and MUST NOT be represented as the restaurant's confirmed recipe

### Requirement: Bounded agentic research
The system SHALL identify dishes with important missing information and use Tavily research only within predefined limits.

#### Scenario: Research is necessary
- **WHEN** an otherwise relevant dish lacks information needed to evaluate a hard restriction
- **THEN** the workflow researches that dish and returns up to three relevant source results

#### Scenario: Research limit reached
- **WHEN** three dishes have been researched or a dish has used two searches
- **THEN** the workflow stops further searches and marks remaining material facts unresolved

#### Scenario: Research is unnecessary
- **WHEN** menu-listed information is sufficient to determine a hard conflict
- **THEN** the workflow does not spend a Tavily request researching that dish

### Requirement: Resilient analysis
The workflow SHALL preserve useful extraction results when research fails, times out, or returns irrelevant sources.

#### Scenario: Tavily unavailable
- **WHEN** Tavily fails or exceeds its timeout
- **THEN** the workflow continues with available evidence and marks affected decisions as needing confirmation or insufficient information

### Requirement: Observable workflow stages
The interface SHALL report actual high-level analysis stages without exposing hidden model reasoning.

#### Scenario: Sequential analysis
- **WHEN** a menu is being analyzed
- **THEN** the interface updates progress across menu reading, evidence checking, bounded research, member matching, and recommendation preparation

