## ADDED Requirements

### Requirement: Supplied MenuKita logo
The application shell SHALL display a transparent rendition of the supplied MenuKita logo without the source JPEG's baked checkerboard background.

#### Scenario: App shell renders
- **WHEN** any application route is displayed
- **THEN** the MenuKita bowl, fish, leaves, and wordmark render as one uncropped transparent asset

### Requirement: Non-stretched food pattern
The primary application flow SHALL use the supplied food illustration as a repeating background rather than stretching one image across the viewport.

#### Scenario: Primary route viewport changes size
- **WHEN** Preferences, Group, Scan, or Results is viewed at supported mobile or desktop widths
- **THEN** the food pattern repeats at a stable tile scale without visible image stretching
- **AND** route content remains readable on sufficiently opaque content surfaces

### Requirement: Responsive branded application surfaces
The branded primary-route layouts SHALL preserve the existing warm red, green, and cream design language while adapting controls and content to narrow and wide viewports.

#### Scenario: Primary flow screen is viewed on a narrow viewport
- **WHEN** Preferences, Group, Scan, or Results is viewed on a narrow viewport
- **THEN** route controls remain reachable without clipping
- **AND** content fits without horizontal page overflow

### Requirement: Consistent primary-route shell
Preferences, Group, Scan, and Results SHALL use the same branded page-shell hierarchy while preserving each route's content-appropriate width and behavior.

#### Scenario: User navigates between flow steps
- **WHEN** the user moves between Preferences, Group, Scan, and Results
- **THEN** the logo, patterned background, translucent header, content surface, border radius, and spacing feel continuous
- **AND** route-specific forms, group actions, scanning, and result interactions continue to function as before
