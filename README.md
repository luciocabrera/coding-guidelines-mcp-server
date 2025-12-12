# Coding Guidelines MCP Server

An MCP (Model Context Protocol) server that provides your coding guidelines and enterprise standards as resources for AI assistants.

## Features

- **Resources**: Access all coding guideline documents as MCP resources
  - Coding Guidelines
  - Enterprise Coding Standards
  - Testing Guide
  - E2E Testing Guide
  - Complete Setup Guide

- **Tools**:
  - `search_guidelines`: Search across all guideline documents
  - `validate_code_pattern`: Validate code against established patterns

## Installation

```bash
npm install
npm run build
```

## Usage

The MCP server is ready to use! Here are the ways to access it:

### Option 1: Direct Testing (Command Line)

Test the server directly to verify it's working:

```bash
# List all resources
echo '{"jsonrpc":"2.0","id":1,"method":"resources/list"}' | node build/index.js

# Read a guideline
echo '{"jsonrpc":"2.0","id":2,"method":"resources/read","params":{"uri":"guidelines://coding-guidelines"}}' | node build/index.js

# Search guidelines
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_guidelines","arguments":{"query":"StyleX"}}}' | node build/index.js
```

### Option 2: MCP Inspector (Visual Testing)

Test interactively with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

### Option 3: Integrate with AI Assistants

The server works with any MCP-compatible AI assistant. Configuration depends on the client:

- **Claude Desktop**: See [Claude MCP docs](https://modelcontextprotocol.io/quickstart/user)
- **Other MCP clients**: Provide the command `node /absolute/path/to/build/index.js`

**Note:** GitHub Copilot does not currently support MCP servers.

## Development

```bash
# Watch mode for development
npm run watch

# Build
npm run build
```

## Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## Available Resources

- `guidelines://coding-guidelines` - Main coding guidelines
- `guidelines://enterprise-standards` - Enterprise coding standards  
- `guidelines://testing-guide` - Testing standards
- `guidelines://e2e-testing` - E2E testing guide
- `guidelines://complete-setup` - Complete setup guide

## Available Tools

### search_guidelines
Search for specific coding guidelines or patterns across all documents.

**Input:**
- `query` (string): Search query (e.g., 'StyleX', 'testing', 'TypeScript')

### validate_code_pattern
Check if a code pattern follows the established guidelines.

**Input:**
- `code` (string): Code snippet to validate
- `category` (string): One of 'component', 'styling', 'types', 'testing', 'file-structure'

## License

MIT
