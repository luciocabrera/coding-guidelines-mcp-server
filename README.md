# Coding Guidelines MCP Server

Model Context Protocol server providing coding guidelines, enterprise standards, and code generation for AI assistants.

## 🎯 What is This?

This MCP server gives AI assistants (GitHub Copilot, Claude, etc.) direct access to your team's coding standards, guidelines, and code generation templates. No more copy-pasting guidelines into prompts!

## ✨ Features

### 📚 Resources

- Coding Guidelines
- Enterprise Coding Standards
- Testing Best Practices
- E2E Testing Patterns
- Complete Setup Guides
- ESLint Rules Documentation

### 🛠️ Tools

- **`search_guidelines`** - Find coding patterns and best practices
- **`validate_code_pattern`** - Check code against standards
- **`get_guideline_summary`** - Get document summaries
- **`generate_code`** - Generate React components/features/hooks/bootstrap projects

## 🚀 Quick Start

### 1. Install & Build

```bash
npm install
npm run build
```

### 2. Configure in VS Code (GitHub Copilot)

Add to your `.vscode/settings.json` or User Settings:

```json
{
  "github.copilot.chat.mcp.servers": {
    "coding-guidelines": {
      "command": "node",
      "args": ["/absolute/path/to/coding-guidelines-mcp-server/build/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/` with your actual path to this repository.

### 3. Restart VS Code

After adding the configuration, restart VS Code to activate the MCP server.

### 4. Use with Copilot

Chat naturally - Copilot will automatically use the tools:

```
You: "Search for React component guidelines"
Copilot: [uses search_guidelines tool]

You: "Generate a Button component with ref support"
Copilot: [uses generate_code tool]

You: "Validate this code: [paste code]"
Copilot: [uses validate_code_pattern tool]
```

## 📖 Full Documentation

See **[MCP_SETUP.md](MCP_SETUP.md)** for:

- Detailed installation steps
- Claude Desktop configuration
- Tool usage examples
- Development guide

## 🔧 Development

### Build

```bash
npm run build
```

### Test Locally

```bash
npm run dev
# Server runs on stdio - you'll see: "Coding Guidelines MCP Server running on stdio"
```

### Validate Code Quality

```bash
npm run validate  # lint + format + typecheck
```

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## 📦 Available Tools

| Tool                    | Description                     | Arguments                                               |
| ----------------------- | ------------------------------- | ------------------------------------------------------- |
| `search_guidelines`     | Search all guideline documents  | `query: string`                                         |
| `validate_code_pattern` | Validate code against standards | `code: string`, `pattern_type: string`                  |
| `get_guideline_summary` | Get document summaries          | `document: string`                                      |
| `generate_code`         | Generate React code artifacts   | `task, name, requirements?, includeTests?, includeRef?` |

## 📚 Available Resources

| URI                                 | Description            |
| ----------------------------------- | ---------------------- |
| `guidelines://coding-guidelines`    | Main coding standards  |
| `guidelines://enterprise-standards` | Enterprise patterns    |
| `guidelines://testing-guide`        | Testing best practices |
| `guidelines://e2e-testing`          | E2E testing patterns   |
| `guidelines://complete-setup`       | Complete setup guide   |
| `guidelines://eslint-rules`         | ESLint rules reference |

## 🎨 Custom ESLint Rules

This project includes TypeScript-based custom ESLint rules for enforcing team standards:

- **`no-inline-type-imports`** - Enforce `import type { X }` instead of `import { type X }`
- **`merge-duplicate-imports`** - Merge multiple imports from same source
- **`destructuring-for-functions`** - Enforce object params for functions with 2+ parameters

See [eslint-local-rules/README.md](eslint-local-rules/README.md) for details.

## 📂 Project Structure

```
├── build/                    # Compiled MCP server (gitignored)
├── guidelines/               # Guideline documents
├── src/
│   ├── index.ts             # MCP server entry point
│   ├── resources/           # MCP resource handlers
│   ├── tools/               # MCP tool implementations
│   └── types/               # TypeScript types
├── eslint-local-rules/      # Custom ESLint rules
└── scripts/                 # Build scripts
```

## 📝 License

MIT
