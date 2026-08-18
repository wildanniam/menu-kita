## ADDED Requirements

### Requirement: Public project overview
The repository SHALL provide a concise public README that explains MenuKita's problem, audience, group demo journey, implemented capabilities, and differentiator before detailed development instructions.

#### Scenario: Judge reviews the repository
- **WHEN** a judge opens the README
- **THEN** they can identify what MenuKita does, why it matters, how the demo works, and where to open the live app without reading internal planning artifacts

### Requirement: Accurate technical documentation
The README SHALL document the current architecture, technology stack, project structure, environment variables, local setup, verification commands, and deployment approach without importing unrelated blockchain concepts from the reference repository.

#### Scenario: Contributor starts local development
- **WHEN** a contributor follows the documented prerequisites and commands
- **THEN** they can install dependencies, configure server-only provider credentials, run the app, and execute the repository's verification scripts

### Requirement: Evidence and safety boundary
The README SHALL distinguish menu-listed evidence, common-usage research, and unresolved facts, and SHALL state that MenuKita does not guarantee allergy safety, halal certification, exact recipes, or cross-contamination safety.

#### Scenario: Reader evaluates a recommendation claim
- **WHEN** the README describes compatibility results or restaurant questions
- **THEN** it explains the evidence provenance and directs material uncertainty to restaurant confirmation rather than claiming definite safety

### Requirement: Collaboration guidance
The README SHALL identify OpenSpec as the mandatory repository change-tracking workflow and link collaborators to the authoritative project context and active specifications.

#### Scenario: Coding agent or partner changes the repository
- **WHEN** they consult the collaboration section
- **THEN** they can find the required OpenSpec commands, source-of-truth order, and secret-handling rule

### Requirement: MIT license declaration
The repository SHALL include the standard MIT license text, link it from the README, and declare `MIT` in package metadata.

#### Scenario: User checks reuse terms
- **WHEN** a user opens the License section or package metadata
- **THEN** they can identify the project as MIT-licensed and open the complete license text
