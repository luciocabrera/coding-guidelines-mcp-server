# 1. Guidelines are resources; validation is a tool

- **Status:** Accepted
- **Date:** 2026-09-02

## Context

MCP gives a server two ways to expose capability to a client, and they are not
interchangeable:

- **Resources** are addressable content. The client lists them, decides which to
  read, and read is expected to be side-effect free and idempotent. Hosts
  typically let the _user_ pick resources to pull into context.
- **Tools** are model-invoked functions. The model decides when to call them,
  with arguments, and the host usually gates that behind a confirmation.

This server has to expose two different things: five guideline documents, and
the ability to check a snippet against the patterns those documents describe.
The naive option is to make everything a tool — a `get_guidelines` tool
alongside `validate_code_pattern` — which several MCP servers do.

## Decision

Guideline documents are **resources**, one URI per document. Validation, search
and generation are **tools**.

The split follows who should be choosing, and whether the call is a read:

- Reading a standards document is a retrieval with no side effects and a stable
  address. A developer asking "what does our styling guide say?" wants _that
  document_, not the model's guess about which document to fetch. Resources let
  the user attach it directly, and let the client cache and re-read by URI.
- Validating a snippet is a computation over an argument the model constructs.
  There is no stable address for "the result of validating this code", and the
  model is the right caller because it holds the snippet.

`search_guidelines` is a tool even though it only reads, because its result is a
function of a query rather than a fixed address. `get_guideline_summary` is a
tool for the same reason — it takes a section argument — and it is the escape
hatch for clients that don't implement resources at all.

## Consequences

**Good.**

- Clients that support resources give users direct control: the guideline shows
  up as something to attach, not something to hope the model retrieves.
- Read paths stay side-effect free and cacheable by URI, and adding a document
  is a manifest entry rather than a new tool.
- Tool descriptions stay short, because they don't have to explain a document
  taxonomy in prose.

**Bad.**

- Resource support across MCP clients is less uniform than tool support. A
  client with tools only cannot see the guidelines as resources at all — which
  is why `get_guideline_summary` exists, and it is genuine duplication of the
  read path.
- The model cannot autonomously decide to read a resource in hosts that require
  user selection, so a question that would have been answered by reading the
  whole document sometimes gets answered by `search_guidelines` instead.

**Neutral.**

- Both surfaces are served from the same manifest
  ([ADR 2](0002-guidelines-as-configuration.md)), so they cannot drift.

## Alternatives considered

- **Everything as tools.** Maximum client compatibility, and simpler to explain.
  Rejected because it discards user-driven attachment and idempotent reads —
  the model would have to guess which document to fetch on every question.
- **Everything as resources.** Validation has no natural URI; encoding a code
  snippet into one would be an abuse of addressing, and resources have no
  argument schema to validate against.
- **One `guidelines://all` resource.** Simplest to implement, but it forces the
  whole corpus (~80 KB) into context to answer a narrow question.
