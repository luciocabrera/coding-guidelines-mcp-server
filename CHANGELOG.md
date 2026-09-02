# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-09-02

The showcase polish pass.

Major rather than minor because a guidelines directory must now contain a
manifest — which breaks any existing `GUIDELINES_PATH` pointing at a bare folder
of Markdown — and because the VS Code floor moves. The MCP wire contract itself
is unchanged: same resource URIs, same tool names and schemas.

### Breaking

- **A guidelines directory must contain `guidelines.config.json`.** Previously
  the served documents were compiled into the binary, so any directory holding
  the five expected filenames worked. The manifest is now required and its
  absence is a startup error. Existing guideline sets need one added; see
  [TEMPLATE.md](TEMPLATE.md).
- **`engines.vscode` raised from `^1.100.0` to `^1.134.0`**, dropping VS Code
  older than 1.134 for the extension. `vsce` refuses to package when
  `@types/vscode` is newer than the declared engine, and the documented Copilot
  MCP integration needs 1.102+ regardless.
- **The committed `.vsix` files are removed.** Build with `npm run build:vsix`,
  or take the artifact attached to a tagged release.
- **Internal handler signatures changed.** `handleSearchGuidelines` and
  `handleGetGuidelineSummary` take the loaded guideline set as their second
  argument, and `getGuidelineSummaryTool` became `createGetGuidelineSummaryTool`.
  This affects anyone importing these modules directly; it does not affect MCP
  clients.

### Added

- Test suite (Vitest): unit coverage for `search_guidelines`,
  `validate_code_pattern`, `get_guideline_summary` and the manifest loader, plus
  an integration suite that drives the built server over stdio.
- CI (GitHub Actions): lint, format check, typecheck, build and test on Node 20
  and 22 for every push and pull request, plus a `.vsix` build uploaded as an
  artifact.
- `guidelines.config.json` manifests — the served guideline set is now
  configuration. `GUIDELINES_PATH` points at any self-describing directory.
- `TEMPLATE.md`: how to point the server at your own standards.
- ADRs: [resources vs tools](docs/adr/0001-mcp-resources-vs-tools.md) and
  [guidelines as configuration](docs/adr/0002-guidelines-as-configuration.md).
- `docs/demo.svg`, recorded from a live server session via `npm run demo`.
- README: architecture diagram, dated compatibility table, project layout.
- Scripts: `test`, `test:watch`, `lint`, `lint:fix`, `typecheck`, `format`,
  `format:check`, `demo`.

### Changed

- All dependencies updated to latest. Audit went from 22 vulnerabilities
  (15 high) to 0. TypeScript is held at 6.0.3 rather than 7.x because
  `typescript-eslint` declares peer `typescript <6.1.0`.
- `engines.vscode` raised to `^1.134.0` to match `@types/vscode`; `vsce` refuses
  to package when the types are newer than the declared engine.
- `moduleResolution` moved off the deprecated `node10`: `Bundler` for the server,
  `Node16` for the extension.
- Guideline definitions moved out of `src/resources/*.resource.ts` (deleted) into
  the manifest. The MCP wire contract is unchanged — same URIs, names,
  descriptions and files.

### Fixed

- **`generate_code` emitted `[object Object]`.** `buildFeatureScaffold`
  interpolated a result object instead of its `.text` into every feature
  scaffold response.
- **`generate_code` returned `text: undefined` for an unrecognised task.** The
  `default` branch returned a different shape than every other branch, hidden by
  a cast at the call site.
- **`get_guideline_summary` truncated sections.** A `##` section ended at its
  first `###` subsection, because the boundary test matched deeper headings too.
- **`tsc --noEmit` never passed.** An unguarded index access in
  `get_guideline_summary`; nothing typechecked the server, since `build:mcp` is
  esbuild.
- **ESLint could not start.** `eslint.config.mjs` imported three packages that
  were never in `devDependencies`. Its ignore globs also never matched their
  intended targets. 542 problems resolved; the tree is clean.
- **README documented commands that did not work.** The "Direct Testing"
  snippets omitted the MCP `initialize` handshake, so they returned nothing.
- **README claimed GitHub Copilot does not support MCP.** Untrue since July 2025.
- Node no longer prints `MODULE_TYPELESS_PACKAGE_JSON` onto the stderr channel
  MCP clients read.

### Still open

- **Whether `validate_code_pattern`'s categories become configuration.** They
  remain compiled into `src/config/validation-rules.ts`. Moving them would
  change the tool's declared `inputSchema.enum`, which is a client-facing
  contract. See [ADR 0002](docs/adr/0002-guidelines-as-configuration.md).

## [1.0.0]

Initial release: MCP server exposing five guideline documents as resources with
search, summary, validation and generation tools, plus a VS Code chat agent.

[2.0.0]: https://github.com/luciocabrera/coding-guidelines-mcp-server/releases/tag/v2.0.0
[1.0.0]: https://github.com/luciocabrera/coding-guidelines-mcp-server/releases/tag/v1.0.0
