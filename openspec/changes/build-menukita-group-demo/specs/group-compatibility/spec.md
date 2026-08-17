## ADDED Requirements

### Requirement: Separate restriction and preference evaluation
The system MUST evaluate hard restrictions independently from soft food preferences and MUST NOT allow a preference score to override a hard conflict.

#### Scenario: Preferred dish contains prohibited ingredient
- **WHEN** a dish strongly matches a member's preferences but contains a prohibited menu-listed ingredient
- **THEN** that member's result is `conflict` regardless of preference match

### Requirement: Compatibility status
Each member-dish result SHALL use exactly one dietary status: `conflict`, `needs_confirmation`, `compatible`, or `insufficient_information`, with evidence-based reasons.

#### Scenario: Confirmed conflict
- **WHEN** menu-listed evidence matches a member's hard restriction
- **THEN** the result is `conflict` and identifies the triggering restriction and evidence

#### Scenario: Possible hard conflict
- **WHEN** a researched common ingredient could violate a hard restriction but the restaurant recipe is unknown
- **THEN** the result is `needs_confirmation`

#### Scenario: Adequate evidence without known conflict
- **WHEN** available information is adequate and no hard conflict is found
- **THEN** the result is `compatible` using wording that does not guarantee safety

#### Scenario: Evidence is too sparse
- **WHEN** available information cannot support a meaningful decision
- **THEN** the result is `insufficient_information`

### Requirement: Group compatibility matrix
The application SHALL present every analyzed dish against every group member in a scannable matrix or equivalent responsive representation.

#### Scenario: View group comparison
- **WHEN** analysis completes
- **THEN** the user can compare statuses across all members and inspect the reasons and evidence for each result

### Requirement: Actionable recommendations
The system SHALL provide a best-for-everyone recommendation when justified and per-member recommendations as a fallback.

#### Scenario: Shared option exists
- **WHEN** at least one dish has no member conflict and ranks highest using status and preferences
- **THEN** the application identifies it as the best group candidate and exposes any required confirmations

#### Scenario: No shared option exists
- **WHEN** every dish conflicts with at least one member
- **THEN** the application states that no single dish works for everyone and presents the best option for each member

### Requirement: Safety wording
The application MUST NOT describe a dish as definitely safe, allergy-safe, certified halal, or otherwise guaranteed based only on menu analysis or general research.

#### Scenario: Compatible result
- **WHEN** a dish receives `compatible`
- **THEN** the interface says that no known conflict was found in the available information and retains relevant confirmation guidance

