## ADDED Requirements

### Requirement: Questions from material uncertainties
The system SHALL generate concise restaurant questions for unresolved facts that could change a hard-restriction decision.

#### Scenario: Possible hidden restricted ingredient
- **WHEN** a commonly used but unconfirmed ingredient conflicts with a member's restriction
- **THEN** the result includes a direct question asking whether the restaurant's dish contains that ingredient

### Requirement: Bilingual questions
The system SHALL provide each restaurant question in English and the detected menu language when those languages differ.

#### Scenario: Non-English menu
- **WHEN** the detected menu language is not English
- **THEN** each question is displayed in English and translated into the detected menu language

#### Scenario: English menu
- **WHEN** the detected menu language is English
- **THEN** the question is displayed once in English without duplicate translation

### Requirement: Copyable questions
The application SHALL allow users to copy an individual question in the language intended for restaurant staff.

#### Scenario: Copy local-language question
- **WHEN** the user activates copy for a translated question
- **THEN** the local-language text is copied and the interface confirms the action

