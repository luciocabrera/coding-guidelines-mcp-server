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

## Defining your own validation categories

`validate_code_pattern` ships with five categories — `component`, `styling`,
`types`, `testing`, `file-structure` — encoding React/TypeScript/StyleX
opinions. Add your own, or redefine one, with a `categories` block in the same
manifest:

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

| Field          | Required       | Notes                                                       |
| -------------- | -------------- | ----------------------------------------------------------- |
| `patterns`     | one of the two | Regex strings. Matching any means the snippet looks right.  |
| `antiPatterns` | one of the two | Matching any triggers `advice`.                             |
| `advice`       | yes            | Shown when an anti-pattern matches. Say what to do instead. |

Your categories are **merged over** the built-ins, not swapped for them. So
`component` still works after you add `docstrings`, and a client that already
prompts for the shipped categories keeps working. Use the same name as a
built-in to override it.

Two things to know about regexes here:

- JSON needs the backslashes doubled — `\\s`, `\\(` — and has no comments, so
  `advice` is the only place to explain intent.
- They are compiled when the server starts. An invalid pattern fails startup
  naming the category, the field and the pattern, rather than silently never
  matching. A category with neither `patterns` nor `antiPatterns` is rejected,
  since it could never report anything.

`tests/fixtures/alt-guidelines/guidelines.config.json` is a working example that
adds two categories and overrides a third; the integration suite runs the real
server against it.

See [`docs/adr/0003-configurable-validation-categories.md`](docs/adr/0003-configurable-validation-categories.md)
for why merging rather than replacing.
