## ADDED Requirements

### Requirement: OpenSpec change before repository edits
Every repository file addition, modification, deletion, dependency update, configuration change, generated artifact, and implementation change MUST belong to a named active OpenSpec change before the edit begins.

#### Scenario: Existing change covers the work
- **WHEN** a collaborator intends to edit the repository and an active OpenSpec change already describes that scope
- **THEN** the collaborator identifies that change and maps the work to one or more of its tasks before editing

#### Scenario: No change covers the work
- **WHEN** a collaborator intends to edit the repository and no active OpenSpec change covers the scope
- **THEN** the collaborator creates and documents a new OpenSpec change before editing other project files

#### Scenario: Small or urgent edit
- **WHEN** a proposed edit is small, urgent, documentation-only, or corrective
- **THEN** the same OpenSpec tracking requirement applies without an undocumented exception

### Requirement: Task-level implementation traceability
Every repository edit MUST map to a checkbox task in the governing OpenSpec change, and implementation MUST follow the approved proposal, requirements, and design.

#### Scenario: Begin an implementation task
- **WHEN** a collaborator starts an edit
- **THEN** the relevant OpenSpec task exists, is still pending, and describes a verifiable outcome for that edit

#### Scenario: Complete an implementation task
- **WHEN** the task's outcome has been implemented and verified
- **THEN** the collaborator marks the task complete in the same change and records any necessary verification or design updates

### Requirement: OpenSpec remains current during development
Collaborators MUST update OpenSpec artifacts whenever implementation, review, or discussion changes scope, requirements, design decisions, risks, or tasks.

#### Scenario: Decision changes during implementation
- **WHEN** a collaborator discovers that an approved requirement or design decision must change
- **THEN** the relevant OpenSpec artifact is updated before implementation continues under the new decision

#### Scenario: New work is discovered
- **WHEN** implementation or review reveals additional required work
- **THEN** that work is added to the governing OpenSpec task list before it is implemented

### Requirement: Validation before completion
Every governing OpenSpec change MUST pass strict validation before it is treated as complete or synchronized as ready for collaborators.

#### Scenario: Complete or share repository work
- **WHEN** repository changes are ready to be treated as complete or synchronized for collaborators
- **THEN** `openspec validate <change> --strict` succeeds and task status accurately reflects the implementation

#### Scenario: Validation fails
- **WHEN** strict OpenSpec validation reports an error
- **THEN** the pull request is not presented as ready until the artifacts are corrected and validation succeeds

### Requirement: Completed-change archival
An OpenSpec change MUST be archived after its implementation is completed and accepted so its delta specs are incorporated into the durable project specifications.

#### Scenario: Change accepted
- **WHEN** all tasks are complete and the associated implementation has been accepted
- **THEN** the collaborator archives the OpenSpec change and verifies that the resulting main specifications describe the accepted behavior

### Requirement: Agent-readable governance
The mandatory workflow MUST be documented in repository entry points read by humans and coding agents.

#### Scenario: Fresh collaborator opens repository
- **WHEN** a human or coding agent reads README.md or AGENTS.md
- **THEN** they can identify the mandatory pre-edit, during-work, validation, and post-completion OpenSpec steps without relying on chat history

### Requirement: Lightweight Git collaboration
GitHub issues, feature branches, and pull requests SHALL be optional for the hackathon workflow and MUST NOT block work that is fully tracked and validated through OpenSpec.

#### Scenario: Fast collaborative update
- **WHEN** a collaborator completes an OpenSpec-tracked and validated update
- **THEN** they can synchronize it directly without creating a GitHub issue or pull request

#### Scenario: Higher-risk or conflicting work
- **WHEN** collaborators decide that isolated review or conflict prevention would materially help a change
- **THEN** they can optionally use a branch or pull request without changing the OpenSpec tracking requirement
