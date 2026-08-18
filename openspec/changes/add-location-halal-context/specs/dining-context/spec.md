## ADDED Requirements

### Requirement: Optional coarse location
The application SHALL request browser location only after a user action and SHALL allow the scan to continue when permission is denied, unavailable, or skipped.

#### Scenario: User shares location
- **WHEN** the user activates the location control and grants permission
- **THEN** the application reverse-geocodes the coordinates once and attaches only the resolved coarse place to the active scan

#### Scenario: Location is denied
- **WHEN** location permission is denied or times out
- **THEN** the application explains that location is optional and retains a manual city fallback

### Requirement: Place-only analysis boundary
The application SHALL send only source, city, region, country, and country code as optional analysis context and MUST NOT include browser coordinates in the analysis request.

#### Scenario: Browser place resolves
- **WHEN** reverse geocoding returns a valid place
- **THEN** the analysis request contains the bounded place fields and no latitude or longitude

#### Scenario: Location is skipped
- **WHEN** the user does not supply a city or browser location
- **THEN** dish analysis continues with no location field

### Requirement: Ephemeral privacy-preserving context
The application MUST NOT persist coordinates or location history and MUST discard coordinates after reverse geocoding.

#### Scenario: Analysis completes or resets
- **WHEN** analysis completes, fails, or the user starts over
- **THEN** precise browser location is not stored in local storage, session storage, logs, or the analysis result
