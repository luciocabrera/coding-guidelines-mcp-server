# MCP Server Setup Guide

This is an MCP (Model Context Protocol) server that provides coding guidelines, standards, and code generation tools to AI assistants like GitHub Copilot.

## What This Server Provides

### Tools

- **`search_guidelines`** - Search for coding patterns and best practices
- **`validate_code_pattern`** - Validate code against enterprise standards
- **`get_guideline_summary`** - Get summaries of guideline documents
- **`generate_code`** - Generate React components, features, hooks, or bootstrap projects

### Resources

- Coding guidelines documents
- Enterprise coding standards
- Testing guides
- E2E testing patterns
- Complete setup guides
- ESLint rules documentation

## Installation

```bash
npm install
npm run build
```

## Usage with GitHub Copilot / Claude Desktop

### 1. Configure MCP Server in VS Code

Add to your VS Code settings (`.vscode/settings.json` or User Settings):

```json
{
  "github.copilot.chat.mcp.servers": {
    "coding-guidelines": {
      "command": "node",
      "args": ["/absolute/path/to/coding-guidelines-mcp-server/build/index.js"],
      "env": {
        "GUIDELINES_PATH": "/absolute/path/to/coding-guidelines-mcp-server/guidelines"
      }
    }
  }
}
```

**Important:** Replace `/absolute/path/to/` with the actual path to this directory.

### 2. Configure MCP Server in Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or equivalent:

```json
{
  "mcpServers": {
    "coding-guidelines": {
      "command": "node",
      "args": ["/absolute/path/to/coding-guidelines-mcp-server/build/index.js"],
      "env": {
        "GUIDELINES_PATH": "/absolute/path/to/coding-guidelines-mcp-server/guidelines"
      }
    }
  }
}
```

### 3. Restart VS Code / Claude Desktop

After adding the configuration, restart the application to activate the MCP server.

## Using with GitHub Copilot

Once configured, Copilot can automatically use the MCP tools. Examples:

```
You: "Search for React component guidelines"
Copilot: [uses search_guidelines tool]

You: "Validate this component against our standards: [code]"
Copilot: [uses validate_code_pattern tool]

You: "Generate a Button component with ref support"
Copilot: [uses generate_code tool]

You: "What are the testing best practices?"
Copilot: [uses get_guideline_summary tool]
```

You can also be explicit:

```
You: "Use the search_guidelines tool to find state management patterns"
```

## Development

### Build

```bash
npm run build
```

### Run Locally

```bash
npm run dev
```

The server communicates via stdio, so you'll see:

```
Coding Guidelines MCP Server running on stdio
```

### Validate Code Quality

```bash
npm run validate  # Runs lint, format check, and typecheck
```

## Custom ESLint Rules

This project includes custom TypeScript-based ESLint rules. See [eslint-local-rules/README.md](eslint-local-rules/README.md) for details.

## File Structure

```
├── build/                    # Compiled MCP server (gitignored)
├── guidelines/               # Coding guideline documents
├── src/
│   ├── index.ts             # MCP server entry point
│   ├── resources/           # MCP resource handlers
│   ├── tools/               # MCP tool implementations
│   │   ├── generate-code/   # Code generation tool
│   │   ├── search-guidelines/
│   │   ├── validate-code-pattern/
│   │   └── get-guideline-summary/
│   └── types/               # TypeScript types
├── eslint-local-rules/      # Custom ESLint rules (TypeScript)
└── scripts/                 # Build scripts
```

## Tools Details

### `search_guidelines`

Searches across all guideline documents for specific patterns, best practices, or standards.

**Arguments:**

- `query` (string): Search query

**Returns:** Formatted search results with context

### `validate_code_pattern`

Validates code against enterprise coding standards and patterns.

**Arguments:**

- `code` (string): Code to validate
- `pattern_type` (string): Type of pattern (component, hook, utility, etc.)

**Returns:** Validation results with suggestions

### `get_guideline_summary`

Gets a summary of a specific guideline document.

**Arguments:**

- `document` (string): Document name (coding-guidelines, testing-guide, etc.)

**Returns:** Document summary

### `generate_code`

Generates React/TypeScript code following enterprise standards.

**Arguments:**

- `task` (string): component | feature | bootstrap | hook
- `name` (string): Name of the artifact
- `requirements` (string, optional): Additional requirements
- `includeTests` (boolean, optional): Include test files
- `includeRef` (boolean, optional): Include ref support (components only)

**Returns:** Generated code with files array

## Contributing

1. Make changes to source files in `src/`
2. Run `npm run build` to compile
3. Run `npm run validate` to ensure quality
4. Test with `npm run dev`

## License

MIT
