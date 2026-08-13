# Domain Docs

This repository uses a single domain context.

## Before exploring

- Read `CONTEXT.md` at the repository root for the product language and domain glossary.
- Read the applicable decisions under `docs/adr/` before changing or specifying the affected area.
- If either source does not exist, continue without treating its absence as an error.

## Use the glossary vocabulary

Use domain concepts exactly as defined in `CONTEXT.md` in issue titles, specifications, implementation plans, tests and code-facing terminology. Avoid synonyms that the glossary explicitly rejects.

If a required concept is absent, first check whether an existing term already covers it. Record a genuine language gap for domain modeling instead of silently inventing competing terminology.

## Respect architectural decisions

Surface conflicts with an existing ADR explicitly rather than silently overriding the decision. Cite the relevant ADR and explain why it may need to be reconsidered.

## Layout

```text
/
├── CONTEXT.md
├── docs/
│   └── adr/
└── src/
```
