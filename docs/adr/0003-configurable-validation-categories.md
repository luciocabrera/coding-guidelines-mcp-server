# 3. Validation categories are configurable, merged over the built-ins

- **Status:** Accepted
- **Date:** 2026-09-02
- **Supersedes:** the open question left in
  [ADR 2](0002-guidelines-as-configuration.md)

## Context

ADR 2 moved the guideline documents into a manifest but deliberately left
`validate_code_pattern`'s five categories — `component`, `styling`, `types`,
`testing`, `file-structure` — compiled into `src/config/validation-rules.ts`,
and recorded three objections to moving them:

1. it would change the tool's declared `inputSchema.enum`, a client-facing
   contract that prompts may be written against;
2. it would turn a checked union into runtime data, losing the exhaustiveness
   guarantee that every category has rules;
3. regexes in JSON are hard to read and cannot be commented.

Against that, the categories encode React/TypeScript/StyleX opinions. A fork
with a different taxonomy — Python docstrings, API versioning — had to edit
`src/` and rebuild, which is precisely the coupling ADR 2 set out to remove. The
repository claims to be a template; the claim was only half true.

## Decision

The manifest gains an optional `categories` block. It is **merged over** the
built-in rules rather than replacing them: a manifest may add categories or
redefine an existing one by name, and every built-in it does not mention
survives.

```json
{
  "guidelines": [...],
  "categories": {
    "docstrings": {
      "patterns": ["\"\"\"[\\s\\S]*?\"\"\""],
      "antiPatterns": ["^def \\w+\\([^)]*\\):\\s*$"],
      "advice": "Every public function needs a docstring."
    }
  }
}
```

Merging is what answers objection 1. Because the shipped categories remain
advertised unless deliberately overridden, an existing client prompting for
`component` keeps working against a fork that added `docstrings`. Replacement
semantics would have silently broken those prompts; that was the real risk, not
configurability itself.

`ValidationCategory` is gone as a union of category names. `BuiltInValidationCategory`
names the five defaults and still types `DEFAULT_VALIDATION_RULES` as an
exhaustive `Record`, so objection 2 holds for the built-ins — which is where it
mattered. A validated category is a plain `string` at the tool boundary, checked
at runtime against the loaded rules.

Objection 3 stands and is accepted. It is mitigated by validation: patterns are
compiled at load time, and an invalid regex fails startup with the category
name, the field, and the offending pattern rather than a silent non-match. A
category with neither `patterns` nor `antiPatterns` is rejected too, since it
could never report anything.

## Consequences

**Good.**

- A fork can express its own taxonomy without touching TypeScript. Verified end
  to end: `tests/fixtures/alt-guidelines/` defines `docstrings`, `type-hints`
  and an override of `types`, and the integration suite boots the real server
  against it and asserts the enum advertises them, that validation works, and
  that the override takes effect.
- The built-in categories stay available, so the tool's contract widens rather
  than changes.
- `validate_code_pattern`'s tool definition is now built per server by
  `createValidateCodePatternTool(rules)`, matching how
  `get_guideline_summary` already worked.

**Bad.**

- The advertised `enum` is no longer fixed across deployments. Two servers built
  from this repo may offer different categories — which is the point, but it
  means the enum is a property of a deployment, not of the project.
- Regexes in JSON need double-escaping (`\\s`, `\\(`) and carry no comments;
  `advice` is the only place to explain intent.
- A manifest can override a built-in with something weaker. That is the
  consumer's prerogative, but nothing warns them they have done it.

**Neutral.**

- Regexes come from the operator's own configuration file, the same trust level
  as source code. No sandboxing is attempted; a pathological pattern is a
  self-inflicted problem, as it would be if written in `src/`.
