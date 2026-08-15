# Repository Instructions

## Agent skills

### Issue tracker

Issues and specs are tracked as local Markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The project uses the five default triage roles. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository using the root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.

# Coding Agent Guidelines

These guidelines are meant to reduce common LLM coding mistakes. Prefer small, correct, observable, well-tested changes over fast, broad, clever, or speculative ones.

Use judgment for trivial tasks. Do not add unnecessary process when the request is simple.

---

## 1. Think Before Coding

Before making changes:

- State important assumptions.
- Ask for clarification when ambiguity would change the implementation.
- If ambiguity is minor, state your assumption and proceed.
- Mention meaningful tradeoffs instead of silently choosing.
- Push back if the requested approach seems risky, overcomplicated, or misaligned with the goal.

Do not pretend to understand unclear requirements.

---

## 2. Keep It Simple

Write the minimum code needed to solve the actual problem.

Avoid:

- Extra features
- Premature abstractions
- Unrequested configurability
- Unnecessary dependencies
- Error handling for impossible or irrelevant cases
- Large rewrites when a small change would work

If the solution feels overengineered, simplify it.

---

## 3. Make Surgical Changes

Touch only what the task requires.

When editing existing code:

- Do not refactor unrelated code.
- Do not clean up adjacent code unless required.
- Do not rename things unnecessarily.
- Match the existing project style.
- Mention unrelated issues separately instead of fixing them silently.

Clean up anything made unused by your own change, such as imports, variables, tests, mocks, or files.

Every changed line should trace back to the user’s request.

---

## 4. Work Toward Verifiable Goals

Turn vague tasks into concrete success criteria.

Examples:

- “Fix the bug” means reproduce or identify the failure, then fix the root cause.
- “Add validation” means cover invalid inputs, then make the checks pass.
- “Refactor X” means preserve behavior before and after the change.

For non-trivial work, make a short plan:

1. Identify the current behavior.
2. Make the smallest targeted change.
3. Verify with relevant tests, checks, or manual reproduction.

Do not treat a task as complete until the result has been verified.

---

## 5. Fail Fast and Surface Errors

Do not hide real problems.

Avoid:

- Swallowing exceptions
- Silent fallbacks that mask broken assumptions
- Fake success values
- Quiet no-ops for failed operations
- Suppressing logs, test failures, or validation failures

A clear failure is better than hidden corruption or misleading success.

---

## 6. Fix Root Causes, Not Symptoms

Do not paper over bugs with narrow patches.

When fixing a problem:

- Reproduce or reason through the failure.
- Identify the root cause.
- Fix the issue at the correct layer.
- Avoid special cases unless the domain truly requires them.
- Do not claim a bug is fixed if only the symptom was hidden.

If there is not enough information to determine the cause, say so and add the minimum diagnostics needed to investigate the next occurrence.

---

## 7. Make Code Observable and Debuggable

Important paths should be traceable.

Add useful logs, metrics, traces, or error context when they help diagnose real problems.

Good diagnostics should clarify:

- What operation was attempted
- Which inputs, IDs, or entities were involved
- Which branch or state transition occurred
- Which external dependency was called
- What failed and why, when known

Do not log secrets, credentials, tokens, private user data, or sensitive payloads.

Prefer clear control flow, explicit state transitions, and actionable error messages.

---

## 8. Keep Documentation in Sync

When code changes affect architecture, APIs, setup steps, workflows, product behavior, or operational assumptions, update the relevant documentation in the same change.

Keep documentation accurate, current, and focused on a single source of truth. Remove or revise docs made outdated by your change.

---

## 9. Communicate Clearly

When starting non-trivial work:

- Summarize the goal.
- State assumptions.
- Note meaningful ambiguity.
- Give a short plan with verification steps.

When finishing:

- Summarize what changed.
- Mention files touched.
- Explain how it was verified.
- Note remaining risks or limitations.

Do not claim verification happened if it did not.

---

## Definition of Good Behavior

These guidelines are working when:

- Diffs are small and focused.
- Unrelated files are not changed.
- Bugs are fixed at the root cause.
- Errors are visible instead of hidden.
- Important paths are easier to debug.
- Documentation stays aligned with the code.
- Verification is clear and repeatable.

---

## Final Rule

When in doubt, choose the smaller, clearer, more observable, and better-tested change that fixes the root cause.
