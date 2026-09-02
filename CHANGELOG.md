# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

The showcase polish pass. Version is still `1.0.0`; see _Release decisions
pending_ below.

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

### Release decisions pending

Two items need a maintainer's call and are deliberately not decided here:

- **Version and tag.** This pass changes `engines.vscode` (a compatibility
  narrowing) and internal function signatures, though the MCP wire contract is
  untouched. `1.1.0` is the natural next version; `2.0.0` if the VS Code floor
  is considered breaking for extension consumers.
- **Whether `validate_code_pattern`'s categories become configuration.** See
  ADR 0002.

[Unreleased]: https://github.com/luciocabrera/coding-guidelines-mcp-server/compare/main...HEAD
