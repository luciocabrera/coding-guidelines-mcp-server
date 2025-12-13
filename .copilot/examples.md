\

# MCP Connection Chain — How GitHub Copilot Calls This MCP Server

This document explains the exact connection flow between GitHub Copilot and this Coding Guidelines MCP Server.

## The Complete Connection Chain

### 1) VS Code Settings Registration

**File:** [.vscode/settings.json](../.vscode/settings.json)

```jsonc
{
  "github.copilot.advanced": {
    "agentSettings": {
      "guardian": {
        "enabled": true,
        "instructionsFile": ".github/copilot-agent-instructions.md",
        "workspaceContext": [
          ".github/copilot-instructions.md",
          "guidelines/coding-guidelines.md",
          ".prettierrc.json",
          "eslint.config.mjs",
        ],
      },
    },
  },
}
```

**What This Does**

- Registers the `@guardian` agent with GitHub Copilot
- Points to the agent instruction file
- Provides a curated list of context files the agent can read

---

### 2) Agent Instructions

**File:** [.github/copilot-agent-instructions.md](../.github/copilot-agent-instructions.md)

```markdown
## CRITICAL: Read ESLint Rules First

BEFORE generating ANY code, ALWAYS review:

- guidelines://eslint-rules
```

**What This Does**

- The agent instructions reference MCP resources using **custom URIs** (here: `guidelines://...`)
- These URIs are exposed by the MCP server
- When the agent needs guidelines, it requests these resources by URI

---

### 3) MCP Server Exposes Resources

**Files:**

- [src/resources/index.ts](../src/resources/index.ts)
- [src/resources/\*.resource.ts](../src/resources)

```ts
export function registerResourceHandlers(server: Server, guidelinesPath: string): void {
  server.setRequestHandler(ListResourcesRequestSchema, () => ({
    resources: GUIDELINES.map(({ uri, name, description, mimeType }) => ({
      uri,
      name,
      description,
      mimeType,
    })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const guideline = GUIDELINES.find((g) => g.uri === request.params.uri);
    // ...read the matching markdown from the local `guidelines/` folder
  });
}
```

**What This Does**

- Exposes guideline documents as MCP resources with `guidelines://` URIs
- Copilot can request these resources by URI
- Content is served from local markdown files under `guidelines/`

---

### 4) MCP Server Exposes Tools

**File:** [src/tools/index.ts](../src/tools/index.ts)

```ts
export function registerToolHandlers(server: Server, guidelinesPath: string): void {
  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: ALL_TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
      case 'search_guidelines':
      case 'get_guideline_summary':
      case 'validate_code_pattern':
      case 'generate_code':
      // ...dispatch to the tool implementations
    }
  });
}
```

**What This Does**

- Registers callable tools that Copilot can invoke
- Each tool declares an input schema and returns results
- Tools perform actions like searching guidelines and generating scaffolds

---

### 5) Tool Implementation Example

**File:** [src/tools/generate-code.tool.ts](../src/tools/generate-code.tool.ts)

```ts
export const generateCodeTool = {
  name: 'generate_code',
  description: 'Generate code scaffolds following the guidelines',
  inputSchema: {
    type: 'object',
    properties: {
      task: { type: 'string', enum: ['component', 'feature', 'bootstrap', 'hook'] },
      name: { type: 'string' },
      requirements: { type: 'string' },
      includeTests: { type: 'boolean' },
      includeRef: { type: 'boolean' },
    },
    required: ['task', 'name'],
  },
};

// In the handler, the server returns a text response and (optionally) a list
// of files that Copilot can materialize in the target workspace.
```

**What This Does**

- Defines tool parameters and validation via JSON schema
- Executes the tool logic (e.g., generating component scaffolds)
- Returns results to Copilot

---

### 6) MCP Server Startup

**File:** [src/index.ts](../src/index.ts)

```ts
const server = new Server(
  { name: 'coding-guidelines-server', version: '1.0.0' },
  { capabilities: { resources: { listChanged: true }, tools: { listChanged: true } } },
);

registerResourceHandlers(server, GUIDELINES_PATH);
registerToolHandlers(server, GUIDELINES_PATH);

const transport = new StdioServerTransport();
await server.connect(transport);
```

**What This Does**

- Initializes the MCP server
- Registers all resources and tools
- Connects via stdio (standard input/output)
- No network calls: pure local communication over stdin/stdout

## The Complete User Flow

```
┌────────────────────────────────────────────────────┐
│ 1. User types: "@guardian create Button"          │
└───────────────────┬────────────────────────────────┘
										↓
┌────────────────────────────────────────────────────┐
│ 2. Copilot loads agent instructions from disk      │
│    - .github/copilot-agent-instructions.md         │
└───────────────────┬────────────────────────────────┘
										↓
┌────────────────────────────────────────────────────┐
│ 3. Agent reads MCP Resource                         │
│    - Requests: guidelines://eslint-rules            │
│    - Server responds with markdown                  │
└───────────────────┬────────────────────────────────┘
										↓
┌────────────────────────────────────────────────────┐
│ 4. Agent calls MCP Tool                             │
│    - Tool: generate_code                            │
│    - Params: { task: "component", name: "Button" }│
└───────────────────┬────────────────────────────────┘
										↓
┌────────────────────────────────────────────────────┐
│ 5. MCP Server executes                              │
│    - Builds a scaffold (text + optional files list) │
│    - Returns result via stdio                       │
└───────────────────┬────────────────────────────────┘
										↓
┌────────────────────────────────────────────────────┐
│ 6. Agent receives results                           │
│    - Creates files in the target project            │
│    - Shows a confirmation message                   │
└────────────────────────────────────────────────────┘
```

## Key Connection Points

### Connection Type: stdio (Standard Input/Output)

```
GitHub Copilot (Client)
				↕
	stdio transport (local, no network)
				↕
MCP Server (running locally)
```

**Why stdio?**

- No network calls required
- Fast local communication
- Secure: no server port exposed
- Simple protocol: JSON-RPC over stdin/stdout

## How to See It In Action

### 1) View MCP Communication (Debug)

Add this to VS Code settings:

```jsonc
{
  "github.copilot.advanced": {
    "debug": {
      "mcp": true,
    },
  },
}
```

### 2) Run With MCP Inspector

```bash
npm run build
npx @modelcontextprotocol/inspector node build/index.js
```

## Summary: Connection Chain

| Step | Component  | Action                               | Communication        |
| ---- | ---------- | ------------------------------------ | -------------------- |
| 1    | User       | Types `@guardian create Button`      | → Copilot            |
| 2    | Copilot    | Loads agent instructions             | → Local file         |
| 3    | Agent      | Requests `guidelines://eslint-rules` | → MCP Server (stdio) |
| 4    | MCP Server | Returns markdown                     | → Agent (stdio)      |
| 5    | Agent      | Calls `generate_code`                | → MCP Server (stdio) |
| 6    | MCP Server | Generates scaffold                   | → Agent (stdio)      |
| 7    | Agent      | Creates files in project             | → File system        |
| 8    | User       | Sees created files                   | Done                 |

## Key Takeaways

1. Copilot calls the MCP server; the server does not call Copilot
2. Communication happens over stdio (local JSON-RPC)
3. Resources provide content (`guidelines://...`)
4. Tools perform actions (`generate_code`, `search_guidelines`, ...)
5. The MCP server itself makes no network calls
