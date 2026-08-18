## ADDED Requirements

### Requirement: Current-user questionnaire
The application SHALL collect the current user's name, dietary requirements, allergies, spice tolerance, likes, and dislikes before group selection.

#### Scenario: Complete questionnaire
- **WHEN** the user supplies all required questionnaire fields and continues
- **THEN** the application stores a normalized current-user profile in browser storage and opens group selection

#### Scenario: Missing required information
- **WHEN** the user attempts to continue without required profile information
- **THEN** the application remains on the questionnaire and identifies the fields that need attention

#### Scenario: Spice tolerance is not selected
- **WHEN** the user attempts to continue without choosing a spice tolerance
- **THEN** the application identifies the missing choice and MUST NOT silently assign a tolerance

### Requirement: Existing demo group selection
The application SHALL offer an existing demo group without requiring authentication, invitation acceptance, or group creation.

#### Scenario: Join the demo group
- **WHEN** the user selects the available demo group
- **THEN** the application opens the group overview with the current user and all source-controlled demo members

#### Scenario: Group has not been joined
- **WHEN** a profiled user reaches group selection before joining the demo group
- **THEN** the application presents the group as a selectable option and keeps menu scanning unavailable

### Requirement: Group overview
The application SHALL summarize each member's hard restrictions and relevant preferences before menu analysis.

#### Scenario: Review group profiles
- **WHEN** the group overview is displayed
- **THEN** the user can distinguish the current user's questionnaire data from the preset members and start a menu scan

### Requirement: Browser-only session
The application MUST operate without accounts or a persistence backend and MUST NOT send profile data anywhere except the analysis API required for the active scan.

#### Scenario: Reload with saved local profile
- **WHEN** a previously onboarded user reloads the prototype in the same browser
- **THEN** the application can restore that user's profile from browser storage
