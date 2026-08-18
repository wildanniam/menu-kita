## ADDED Requirements

### Requirement: Member-focused result navigation
The results screen SHALL provide one selectable control for each group member and one `All` control, and SHALL show only information relevant to the active selection.

#### Scenario: Current user opens validated results
- **WHEN** a validated result and current user profile exist
- **THEN** the current user's member view is selected by default
- **AND** all group members and the `All` overview remain directly selectable

#### Scenario: User selects another member
- **WHEN** the user activates a member control
- **THEN** the screen shows that member's profile preferences, best recommendation, dish compatibility rows, and relevant confirmation questions
- **AND** it does not render the full expanded matrix for every other member

#### Scenario: User selects the group overview
- **WHEN** the user activates `All`
- **THEN** the screen shows the shared recommendation and a compact all-member compatibility overview for each dish

### Requirement: Compact progressive disclosure
The results screen SHALL keep a dish's decision-critical summary visible while placing detailed reasons and evidence in an expandable disclosure.

#### Scenario: Dish row is collapsed
- **WHEN** a dish disclosure is not open
- **THEN** the dish name, price when present, dietary status, and preference score or member-status summary remain visible

#### Scenario: Dish row is expanded
- **WHEN** the user opens a dish disclosure
- **THEN** the screen shows the applicable explanation, uncertainties, listed ingredients, and evidence provenance without losing the existing safety distinctions

### Requirement: Scoped restaurant confirmations
The results screen SHALL associate restaurant questions with the members referenced by the validated question data.

#### Scenario: Selected member has a relevant question
- **WHEN** a restaurant question includes the active member ID
- **THEN** the member view shows that question with its available localized text and copy action

#### Scenario: Selected member has no relevant questions
- **WHEN** no restaurant question includes the active member ID
- **THEN** the member view states that there are no additional restaurant confirmations generated for that member

### Requirement: Result interaction accessibility
Member selection and dish disclosure controls SHALL be keyboard operable and expose their selected or expanded state to assistive technology.

#### Scenario: Keyboard-only navigation
- **WHEN** a user navigates the results screen without a pointer
- **THEN** they can select a member, open a dish, and copy a restaurant question with visible focus and semantic control state
