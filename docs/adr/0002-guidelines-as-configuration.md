# 2. The guideline set is configuration, not code

- **Status:** Accepted
- **Date:** 2026-09-02

## Context

Each guideline document was originally a TypeScript module under
`src/resources/` exporting a `Guideline` literal, collected into a
`GUIDELINES` array that resources and tools imported directly.

That made the server a personal one. Adding a document meant writing a module,
editing a barrel file and rebuilding; using a different organisation's standards
meant editing `src/`. The repository is meant to be reusable as a template, so
"fork it and edit the source" is the thing to avoid.

## Decision

A guidelines directory describes itself. Each one carries a
`guidelines.config.json` manifest listing its documents; the server loads it at
startup from `GUIDELINES_PATH` and passes the result into the resource and tool
handlers.

The five `*.resource.ts` modules are deleted. No module-level `GUIDELINES`
constant remains — handlers receive the loaded set as an argument.

The manifest is validated on load and failures are fatal, naming the offending
entry index and field. A mistyped filename should stop the server at startup,
not silently serve four documents where five were expected.

## Consequences

**Good.**

- Swapping guideline sets is one environment variable. Verified, not asserted:
  the integration suite boots the real built server against
  `tests/fixtures/alt-guidelines/` — different URIs, different filenames, a
  different document count — and asserts it serves that set.
- Adding a document is a manifest entry.
- `get_guideline_summary`'s schema enumerates whatever is loaded, so its input
  schema follows the manifest automatically.

**Bad.**

- The tool list can no longer be a module-level constant, because
  `get_guideline_summary` depends on the loaded documents. It is built per
  server instance by `buildTools(guidelines)`, and registration moved inside
  `main()` to await the load. Slightly more indirection than a static array.
- A malformed manifest is now a startup failure rather than a compile error.
  This is the intended trade — the point is to be editable without a
  toolchain — but it moves a class of mistake from build time to run time,
  which is why validation is explicit and the messages name the field.

## The open question: validation categories

`validate_code_pattern`'s five categories — `component`, `styling`, `types`,
`testing`, `file-structure` — remain hardcoded in
`src/config/validation-rules.ts`, as a compile-time union in `src/types.ts`.

They were deliberately **not** moved into the manifest, and this is flagged for
a human decision rather than settled here. Moving them would:

- change `validate_code_pattern`'s declared `inputSchema.enum`, which is a
  public contract that existing clients may have prompts written against;
- turn a checked union into runtime data, losing the exhaustiveness checking
  that currently guarantees every category has rules;
- require expressing regex pattern/anti-pattern pairs in JSON, where they are
  markedly less readable and cannot be commented.

Against that: an organisation whose taxonomy differs is currently stuck editing
`src/`, which is exactly the coupling this ADR set out to remove — so the
argument for doing it is real, it is just not free.

Deferred pending a decision on whether client-facing schema stability or
consumer flexibility matters more here.
