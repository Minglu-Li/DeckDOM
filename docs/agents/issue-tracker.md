# Issue tracker: Local Markdown

Issues and specs (also known as PRDs) for this repository live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`; never use a single combined tickets file.
- Triage state is recorded as a `Status:` line near the top of each issue file. See `triage-labels.md` for the role strings.
- Comments and conversation history are appended under a `## Comments` heading at the bottom of the file.

## When a skill says "publish to the issue tracker"

Create a new Markdown file under `.scratch/<feature-slug>/`, creating the feature directory if necessary. A spec is published as `spec.md` and includes its current `Status:` near the top.

## When a skill says "fetch the relevant ticket"

Read the referenced file. The user will normally provide its path or issue number directly.

## Wayfinding operations

The `wayfinder` workflow uses one map file and one child file per ticket.

- Map: `.scratch/<effort>/map.md`, containing Notes, Decisions-so-far and Fog.
- Child ticket: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with `Type:` and `Status:` lines near the top.
- Blocking: a `Blocked by: NN, NN` line. A ticket is unblocked when every listed issue is resolved.
- Frontier: scan the feature's `issues/` directory for open, unblocked and unclaimed files; the lowest number wins.
- Claim: set `Status: claimed` and save before starting work.
- Resolve: append the result under `## Answer`, set `Status: resolved`, and add a short decision pointer to the map.
