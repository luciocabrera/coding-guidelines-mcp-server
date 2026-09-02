# HANDOFF_INVENTORY.md

**Temporary document** produced by Phase 0 of the showcase-polish handoff plan.
Delete once the polish pass lands. Captured: 2026-09-01, commit `3f5c970` (only commit; branch `main`, clean tree).

---

## 1. What this repo actually is

Two things shipped from one package:

1. **An MCP server** (`src/index.ts` → esbuild bundle at `build/index.js`) exposing five markdown guideline documents as MCP *resources* and four *tools* over stdio.
2. **A VS Code chat-participant extension** (`src/extension/` → `tsc` output at `out/`) that spawns that MCP server as a child process and surfaces it as `@guidelines` in VS Code Chat.

The README documents only #1. The extension is undocumented in the README, though it is what `package.json` describes (`"displayName": "Coding Guidelines Agent"`).

## 2. File-by-file inventory

### Root config

| File | What it does | Notes |
|---|---|---|
| `package.json` | name `coding-guidelines-agent`, v1.0.0, MIT, publisher `coding-guidelines`, `main: ./out/extension.js`. Scripts: `build:mcp`, `build:extension`, `build`, `watch`, `vscode:prepublish`, `package`. | **No `test` script.** `"author": ""`. Single runtime dep: `@modelcontextprotocol/sdk ^1.24.3`. |
| `tsconfig.json` | Root TS config for `src`, ESNext modules, `strict`, `noUncheckedIndexedAccess`. | Never invoked by any script — nothing runs `tsc -p tsconfig.json`. See §4.1. |
| `src/extension/tsconfig.json` | CommonJS, `outDir: ../../out`, target ES2022. | This is the only tsconfig a build script uses. |
| `eslint.config.mjs` | flat config: `eslint.configs.recommended` + `recommendedTypeChecked` + prettier integration, ignores `build/`, `*.js`, `*.mjs`. | **Currently unrunnable.** See §4.2. |
| `.prettierrc.json` | singleQuote, trailingComma all, printWidth 100, semi. | Source files are actually written with double quotes — prettier has evidently never been run over `src/`. |
| `.gitignore` | ignores `node_modules`, `dist`, `build`, `coverage`, `*.log`, `.idea`, `.vscode`. | `build/` ignored, **`out/` is not** — see §3. |
| `LICENSE` | MIT, "Copyright (c) 2025 Coding Guidelines". | Copyright holder is a placeholder org name, not Lucio. Out of scope per ground rule 4. |
| `README.md` | ~110 lines: features, install, usage, dev, resources, tools, license. | Contains two inaccurate claims — see §4.3 and §4.4. |

### `scripts/`

- `build-mcp.mjs` — esbuild: bundles `src/index.ts` → `build/index.js` (ESM, node20, bundled, chmod 755). ~654 KB output (SDK inlined). No watch/minify/sourcemap.

### `src/` — MCP server

- `index.ts` — creates the `Server`, resolves `GUIDELINES_PATH` from env or `join(__dirname, "../guidelines")`, registers resource + tool handlers, connects `StdioServerTransport`.
- `types.ts` — all shared types: `Guideline`, `ValidationRule`, `ValidationCategory` (union of the 5 hardcoded categories), tool arg types, `SearchResult`.
- `config/validation-rules.ts` — `VALIDATION_RULES: Record<ValidationCategory, ValidationRule>`. 5 categories, each with `patterns` / `antiPatterns` regex arrays + `advice` string. **Hardcoded at compile time** (Phase 5.3 target).
- `resources/` — one file per guideline, each exporting a `Guideline` literal (uri, name, description, mimeType, file). `index.ts` collects them into `GUIDELINES[]` and registers `resources/list` + `resources/read`. **The URI→file mapping is source code, not config** (Phase 5.1 target).
- `tools/`
  - `search-guidelines.tool.ts` — case-insensitive substring match per line across all guidelines; returns formatted matches. Pure substring, no fuzzy matching.
  - `validate-code-pattern.tool.ts` — regex pattern/anti-pattern check for one category; returns ✅ or ⚠️ text. Handles unknown category with a text message (not an error).
  - `get-guideline-summary.tool.ts` — full-doc first-20-lines summary, or markdown section extraction by header text.
  - `generate-code.tool.ts` — 816 lines, by far the largest file. Scaffolds components/features/hooks/whole-project bootstraps as file+command payloads.
  - `index.ts` — `ALL_TOOLS` + `tools/list` / `tools/call` dispatch. Uses `args as any` for `generate_code`.
- `utils/` — `file-reader.ts` (read one guideline, rethrow as friendly error) and `search.ts` (`searchInGuideline`, `formatSearchResults`, `extractContext` — **`extractContext` is exported but never used anywhere**).

### `src/extension/` — VS Code extension

- `extension.ts` (516 lines) — registers chat participant `coding-guidelines.agent` (`@guidelines`), routes `/search`, `/validate`, `/summary` and a generate path, writes generated files into the workspace and runs post-commands (adding placeholder npm scripts if missing).
- `mcp-client.ts` (172 lines) — spawns `node <extensionPath>/build/index.js`, line-delimited JSON-RPC over stdio, resolves on the stderr banner `running on stdio` **or** a 1 s timeout. Does not perform an MCP `initialize` handshake.
- `index.ts` — re-exports `activate`/`deactivate`.

### `guidelines/` — the content

| File | Size | Exposed as a resource? |
|---|---|---|
| `coding-guidelines.md` | 6.5 KB | ✅ `guidelines://coding-guidelines` |
| `enterprise_coding_standards.md` | 38.6 KB | ✅ `guidelines://enterprise-standards` |
| `testing_guide.md` | 11.7 KB | ✅ `guidelines://testing-guide` |
| `e2e_testing_guide.md` | 11.7 KB | ✅ `guidelines://e2e-testing` |
| `complete_setup_guide.md` | 9.6 KB | ✅ `guidelines://complete-setup` |
| `package_json_config.json` | 3.0 KB | ❌ not registered |
| `playwright_config.ts` | 2.5 KB | ❌ not registered |

Content is generic React 19 / TypeScript / StyleX / React Router 7 standards — no client-identifying material. Two files ship in the package but are unreachable through the server.

### `out/` — checked-in build output

`extension.js`, `index.js`, `mcp-client.js` + `.map` for each. These are the `tsc` output of `src/extension/`. **Tracked in git** while `build/` (the esbuild output) is gitignored. Answering the plan's Phase 0 question: `out/` is build output that is checked in **by omission, not by intent** — `.gitignore` lists `dist` and `build` but not `out`, and `out/` is required at runtime because `package.json` `main` points at it. For a VS Code extension that gets packaged from source, it should be gitignored and built in `vscode:prepublish` (which already runs `npm run build`).

### `.vsix` files — both stale

Both were **hand-packaged from an older source layout** and neither is reproducible from the current build scripts. There is no `build:vsix` script; `npm run package` runs `vsce package` against whatever is on disk at the time.

| | `coding-guidelines-agent-1.0.0.vsix` | `coding-guidelines-mcp-server-1.0.0.vsix` |
|---|---|---|
| manifest `name` | `coding-guidelines-agent` | `coding-guidelines-mcp-server` |
| manifest `main` | `./out/extension.js` | `./build/extension/extension.js` |
| manifest `description` | "VS Code Chat Agent with MCP server…" | "MCP server and VS Code Chat Agent…" |
| contains `out/` | yes | no |
| contains `build/extension/` | no | yes |
| `build/index.js` | 654 KB (bundled) | 1.3 KB (unbundled) |

Evidence they are stale: both contain `build/resources.js`, `build/tools.js` and `build/utils.js` — flat modules that **do not exist in the current `src/` layout** — alongside the per-file `build/resources/*.js`. Only the first matches the current `package.json` manifest; the second describes a package name that doesn't exist in the repo today. Neither can be regenerated by `npm run build && npm run package` as-is.

## 3. Build / verification status as of today

Ran on a clean `npm install` (455 packages):

| Command | Result |
|---|---|
| `npm install` | ✅ (22 vulns reported: 1 low, 6 moderate, 15 high — mostly `@vscode/vsce`/`keytar` transitive) |
| `npm run build` | ✅ both halves succeed |
| `npx tsc --noEmit -p tsconfig.json` | ❌ **fails** — see §4.1 |
| `npx eslint .` | ❌ **fails to start** — see §4.2 |
| `npm test` | ❌ no such script; **no test files exist anywhere** (`*.test.*` / `*.spec.*`: none) |
| CI | ❌ no `.github/` directory at all |

## 4. Defects found (beyond the ones the plan already named)

### 4.1 Typecheck is broken

```
src/tools/get-guideline-summary.tool.ts(73,36): error TS2532: Object is possibly 'undefined'.
```

`lines[sectionStart]` is indexed without a guard under `noUncheckedIndexedAccess`. This has never been caught because **nothing typechecks the server**: `build:mcp` uses esbuild (which strips types without checking them) and `build:extension` only compiles `src/extension/`. The MCP server's TypeScript is effectively unchecked today. Phase 3's `tsc --noEmit` step will fail on day one unless this is fixed first.

### 4.2 Lint cannot run — missing devDependencies

`eslint.config.mjs` imports `@eslint/js` and `eslint-plugin-prettier/recommended`; neither is in `devDependencies`, and `eslint-config-prettier` (required by the plugin's recommended config) is absent too. `npx eslint .` dies with `ERR_MODULE_NOT_FOUND`. Phase 3 assumes "eslint.config.mjs already exists, use it" — it exists but has never been executed.

Once it does run, expect a large volume of `prettier/prettier` errors: `.prettierrc.json` sets `singleQuote: true` and the entire codebase uses double quotes.

### 4.3 README "Direct Testing" commands do not work — **verified, not assumed**

The three `echo … | node build/index.js` snippets produce no JSON-RPC response. The MCP SDK requires an `initialize` request plus a `notifications/initialized` notification before it will service any other method. Piping a bare `resources/list` prints only the stderr banner and exits.

Verified working form:

```bash
printf '%s\n%s\n%s\n' \
  '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":1,"method":"resources/list"}' \
  | node build/index.js
```

…which returns the initialize result followed by all five resources. This is a second stale README claim for Phase 1 alongside the Copilot one, and it is exactly what the Phase 2.4 smoke test should encode.

### 4.4 README Copilot claim (already known)

> "**Note:** GitHub Copilot does not currently support MCP servers."

Outdated per the handoff plan; to be replaced with a dated, live-verified note in Phase 1/6. **Not yet re-verified against a running client — that is Phase 6 work.**

### 4.5 README omissions

- Documents four resources' worth of tools as two (`search_guidelines`, `validate_code_pattern`); `get_guideline_summary` and `generate_code` — including the 816-line generator — are undocumented.
- The VS Code chat-participant extension, `@guidelines`, is not mentioned at all.
- `npm run build` is documented, but the README's commands reference `build/index.js` while `package.json` `main` points at `out/extension.js`; the two artifacts are never distinguished for the reader.
- No `MODULE_TYPELESS_PACKAGE_JSON` note: running `node build/index.js` emits a Node warning on stderr because `package.json` has no `"type": "module"` while the esbuild output is ESM. Harmless but noisy in any recorded demo.

### 4.6 Minor

- `extractContext` in `src/utils/search.ts` is dead code (exported, never imported).
- `src/tools/index.ts` uses `args as any` for `generate_code`, which the lint config flags as `no-explicit-any` (warn) once lint runs.
- `MCPClient.connect()` resolves after a 1 s timeout regardless of whether the server started, so a failed spawn surfaces later as a confusing request timeout.

## 5. GitHub repo metadata (via `gh repo view`)

```json
{ "name": "coding-guidelines-mcp-server", "description": "", "repositoryTopics": null,
  "visibility": "PUBLIC", "isTemplate": false,
  "url": "https://github.com/luciocabrera/coding-guidelines-mcp-server" }
```

Confirms Phase 1.2 and Phase 5.4: description empty, no topics, not a template repo. `gh auth status` shows the `luciocabrera` account authenticated with `repo` + `workflow` scopes, so CI workflow files and `gh repo edit` are both possible without further setup.

Note the repo is named `…-mcp-server` while `package.json` is named `coding-guidelines-agent`. Renaming either is behind ground rule 4 — flagged, not touched.

## 6. Implications for the later phases

- **Phase 1** has three items, not two: the Copilot claim, the repo metadata, *and* the non-functional Direct Testing snippets (§4.3).
- **Phase 2** has no existing test convention to respect — Vitest is unconstrained. Note `src/` is ESM/NodeNext-ish while `src/extension/` is CommonJS against the `vscode` module, which cannot be imported outside VS Code; test the server, not the extension.
- **Phase 3** cannot pass until §4.1 and §4.2 are fixed. Sequence: fix typecheck + add the missing lint deps + reconcile prettier quoting **before** wiring CI, or the first green build is unreachable.
- **Phase 5** targets are precisely `src/resources/*.resource.ts` (URI→file mapping) and `src/config/validation-rules.ts` (categories). Both are small and self-contained; neither requires touching handler code. The `ValidationCategory` union type in `types.ts` is what makes categories compile-time — Phase 5.3's decision is really "keep the union, or widen it to `string` and validate at runtime". That is a public contract change, so it stays a question for Lucio.
- **Phase 7** must resolve the `.vsix` inconsistency documented above; the two committed files disagree with each other *and* with the current source, so "reproduce equivalent artifacts" is not achievable for the second one — removing it in favour of CI release artifacts is the cleaner path.
