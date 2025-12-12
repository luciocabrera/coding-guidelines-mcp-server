#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { registerResourceHandlers } from "./resources/index.js";
import { registerToolHandlers } from "./tools/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the guidelines folder containing coding guidelines
const GUIDELINES_PATH = process.env.GUIDELINES_PATH || join(__dirname, "../guidelines");

// Create server instance
const server = new Server(
  {
    name: "coding-guidelines-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {
        listChanged: true,
      },
      tools: {
        listChanged: true,
      },
    },
  }
);

// Register all handlers
registerResourceHandlers(server, GUIDELINES_PATH);
registerToolHandlers(server, GUIDELINES_PATH);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Coding Guidelines MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
