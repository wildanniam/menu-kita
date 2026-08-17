## Why

MenuKita is being developed by multiple people and coding agents, so decisions that exist only in chat can be missed or contradicted. Every repository update needs an OpenSpec record that keeps intent, requirements, design decisions, and implementation progress visible to all collaborators.

## What Changes

- Require every repository change to belong to an active OpenSpec change before files are edited.
- Require each implementation edit to map to a documented OpenSpec task.
- Require collaborators to update relevant proposal, spec, design, and task artifacts as decisions or scope evolve.
- Require strict OpenSpec validation and change traceability in pull requests.
- Require completed changes to be archived so main specs remain the durable source of truth.
- Document the mandatory workflow for humans and coding agents in README and AGENTS.md.

## Capabilities

### New Capabilities

- `openspec-change-governance`: Repository-wide rules for recording, implementing, validating, reviewing, and archiving every change through OpenSpec.

### Modified Capabilities

None.

## Impact

- Changes the required contribution workflow for every collaborator and coding agent.
- Updates `README.md` and `AGENTS.md` with mandatory steps and pull-request traceability.
- Adds a governance specification but does not change application runtime behavior.
