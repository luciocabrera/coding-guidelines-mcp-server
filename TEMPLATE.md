# Fork & Configure

How to point this server at your own coding standards. No TypeScript required.

## The idea

A **guidelines directory** is self-describing: it holds your documents plus a
`guidelines.config.json` manifest naming them. The server reads that manifest at
startup, so which documents exist — and what URIs they answer to — is data, not
code. Swapping guideline sets means pointing `GUIDELINES_PATH` somewhere else.

```
your-guidelines/
├── guidelines.config.json   ← the manifest
├── frontend-standards.md
└── api-conventions.md
```

## Steps

**1. Fork the repo** (or click _Use this template_ on GitHub).

**2. Replace the documents.** Delete what's in `guidelines/` and drop your own
Markdown in. Filenames are yours to choose — the manifest maps them.

**3. Write the manifest.** Create `guidelines/guidelines.config.json`:

```json
{
  "guidelines": [
    {
      "uri": "guidelines://frontend",
      "name": "Frontend Standards",
      "description": "Component, styling and state conventions",
      "file": "frontend-standards.md"
    },
    {
      "uri": "guidelines://api",
      "name": "API Conventions",
      "description": "REST shapes, versioning and error envelopes",
      "file": "api-conventions.md"
    }
  ]
}
```

| Field         | Required | Notes                                                         |
| ------------- | -------- | ------------------------------------------------------------- |
| `uri`         | yes      | How clients address the resource. Any scheme; must be unique. |
| `name`        | yes      | Shown to users, and used by `get_guideline_summary`.          |
| `description` | yes      | One line; clients show this when listing resources.           |
| `file`        | yes      | Filename relative to the guidelines directory.                |
| `mimeType`    | no       | Defaults to `text/markdown`.                                  |

The loader fails at startup with a specific message — naming the entry index and
field — rather than silently dropping a document.

**4. Rebuild and check.**

```bash
npm run build
npm test
```

**5. Point a client at it.** See the README's client configuration. To serve a
guideline set from outside the repo, set `GUIDELINES_PATH`:

```bash
GUIDELINES_PATH=/absolute/path/to/your-guidelines node build/index.js
```

## What you don't have to touch

Nothing under `src/`. Adding, removing or renaming documents is a manifest edit.
`tests/fixtures/alt-guidelines/` is a working second guideline set with different
URIs, filenames and document count — the integration suite boots the real server
against it, so the claim on this page is tested rather than asserted.

## What you may want to touch

`validate_code_pattern`'s categories — `component`, `styling`, `types`,
`testing`, `file-structure` — are still defined in
[`src/config/validation-rules.ts`](src/config/validation-rules.ts) as regex
pattern/anti-pattern pairs. They encode React/TypeScript/StyleX opinions. If
your taxonomy differs, edit that file; the categories are a compile-time union
in `src/types.ts`, so the compiler will point you at everything that needs
updating.

Making these config-driven too is deliberately **not** done here: it would move
the category list from a checked type into runtime data and change the tool's
declared input schema, which is a public contract change. See
[`docs/adr/0002-guidelines-as-configuration.md`](docs/adr/0002-guidelines-as-configuration.md).
