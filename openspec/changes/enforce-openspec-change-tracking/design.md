## Context

MenuKita uses OpenSpec as its shared agreement layer, but the existing documentation only recommends capturing material decisions. Wildan has now established a stricter repository policy: every update and change must be tracked in OpenSpec so parallel human and agent work remains auditable and consistent.

## Goals / Non-Goals

**Goals:**

- Make OpenSpec tracking mandatory before any repository edit.
- Provide a simple lifecycle that a fresh human or coding agent can follow.
- Connect implementation tasks, evolving decisions, validation, collaboration sync, and archival.
- Apply the rule consistently to code, documentation, configuration, dependencies, and generated files.

**Non-Goals:**

- Add a new CI check or Git hook in this documentation-only change.
- Make GitHub issues, branches, reviews, or tests mandatory when OpenSpec tracking already covers the work.
- Require a separate OpenSpec change for every file when several files belong to one coherent change.

## Decisions

### One governing change per coherent scope

A repository edit belongs to one named active OpenSpec change whose proposal and tasks cover the work. Multiple related files can share one change; unrelated scope requires another change. This preserves useful traceability without creating file-level bureaucracy.

### Mandatory lifecycle

The contribution lifecycle is:

1. Run `openspec list --json` and identify the governing change.
2. Create a change when none covers the intended work.
3. Ensure proposal/spec/design/tasks describe the work before other files are edited.
4. Implement only mapped tasks and update artifacts when decisions change.
5. Mark tasks complete immediately after implementation and verification.
6. Run strict validation before treating the change as complete or synchronizing it as ready for collaborators.
7. Synchronize the small validated update directly; use GitHub issues, branches, or pull requests only when the team finds them useful.
8. Archive the accepted completed change and verify synced specifications.

Planning artifacts and the archival operation are tracked by the same governing change. There is no exemption for tiny or urgent edits; a minimal coherent change is acceptable.

### Documentation-first enforcement

Place the normative agent instruction in `AGENTS.md` and the human collaboration explanation in `README.md`. This immediately guides installed coding agents and partners without introducing scripts during the repository's specification phase. Automated CI enforcement can be proposed later through its own OpenSpec change.

### Relationship to GitHub workflow

OpenSpec is the mandatory record of product intent and implementation state. GitHub issues, feature branches, and pull requests are optional coordination mechanisms, not gates. Small hackathon updates can be committed and synchronized directly once their OpenSpec artifacts, tasks, and validation are current. Collaborators can still use isolation or review when risk or concurrent edits justify it.

## Risks / Trade-offs

- [The rule adds overhead for tiny edits] → Allow minimal but complete changes while keeping the no-exception traceability rule.
- [Artifacts become stale during fast iteration] → Require updates at the moment scope or design changes, not only before review.
- [Two collaborators edit the same change concurrently] → Use task ownership and coordinate shared artifact edits before parallel work.
- [Documentation alone can be ignored] → Put the rule in AGENTS.md and README now, then consider CI enforcement as a separately approved change.

## Migration Plan

1. Add this governance change before modifying repository guidance.
2. Update README.md and AGENTS.md with the mandatory lifecycle.
3. Validate this change strictly and commit it with the documentation.
4. Apply the workflow to every subsequent repository update.
5. Archive this change after acceptance.

No runtime rollback is necessary. Reverting the documentation commit removes the policy text but does not affect application behavior.

## Open Questions

None.
