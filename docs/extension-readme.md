# Coding Guidelines Agent

A VS Code chat participant that answers questions against your team's coding
guidelines, and scaffolds code that follows them.

It runs a [Model Context Protocol](https://modelcontextprotocol.io) server in the
background, which serves your guideline documents as MCP resources and exposes
search, validation and generation as MCP tools.

## Usage

Type `@guidelines` in the Chat view:

| Command                                 | What it does                              |
| --------------------------------------- | ----------------------------------------- |
| `@guidelines /search StyleX`            | Search every guideline document           |
| `@guidelines /validate <code>`          | Check a snippet against the guidelines    |
| `@guidelines /summary Testing Guide`    | Summarise a document, or one section      |
| `@guidelines create a Button component` | Scaffold code that follows the guidelines |

## Configuring your own guidelines

The documents are not baked into the extension. A guidelines directory carries a
`guidelines.config.json` manifest listing its documents, so you can point the
server at your own standards without touching TypeScript.

See [TEMPLATE.md](https://github.com/luciocabrera/coding-guidelines-mcp-server/blob/main/TEMPLATE.md).

## Requirements

VS Code 1.134 or newer.

## Using the MCP server on its own

The same server works with any MCP client — GitHub Copilot, Claude Desktop, or
anything speaking MCP over stdio. See the
[repository README](https://github.com/luciocabrera/coding-guidelines-mcp-server#readme).

## License

MIT
