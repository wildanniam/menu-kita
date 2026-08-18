## ADDED Requirements

### Requirement: Member-specific question eligibility
The system SHALL create a restaurant-question candidate only for a member-and-dish compatibility result whose hard-restriction status is `needs_confirmation` and that contains at least one unresolved material fact.

#### Scenario: Member has a material unresolved restriction
- **WHEN** one member's dish result needs confirmation and identifies an unresolved fact
- **THEN** the system creates a question candidate associated only with that member and dish

#### Scenario: Member's result is already clear
- **WHEN** a member's dish result is compatible, conflicting, insufficient without a material question, or has no unresolved fact
- **THEN** the system creates no restaurant question for that member and dish

### Requirement: Personalized and isolated wording
The system SHALL generate each question using only the affected member's name, triggered hard restrictions, dish, and unresolved facts, and SHALL NOT merge unrelated restrictions from other members into that question.

#### Scenario: Different members have different restrictions for one dish
- **WHEN** two members need confirmation for the same dish because of different restrictions
- **THEN** each member receives a separately associated question whose wording reflects only that member's relevant context

#### Scenario: Model output references the wrong member
- **WHEN** generated output does not match the supplied member-and-dish candidate identity
- **THEN** the system rejects that draft and creates a deterministic personalized fallback for the correct member

### Requirement: Member-scoped presentation
The results interface SHALL display only questions associated with the selected member and SHALL omit the restaurant-question section when that selected member has no questions.

#### Scenario: Selected member has questions
- **WHEN** the user selects a member with one or more associated questions
- **THEN** the interface shows only that member's questions and the existing localized copy action

#### Scenario: Selected member has no questions
- **WHEN** the user selects a member with no associated questions
- **THEN** the interface does not render an empty restaurant-question section

### Requirement: Group question overview
The `All` results view SHALL retain every material personalized question and identify the affected member for each question.

#### Scenario: Group contains multiple personalized questions
- **WHEN** the user selects `All`
- **THEN** the interface shows the remaining questions with an affected-member label so the group knows who needs each confirmation
