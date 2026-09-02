#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadGuidelines } from './config/guidelines-manifest.js';
import { registerResourceHandlers } from './resources/index.js';
import { registerToolHandlers } from './tools/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the guidelines folder containing coding guidelines
const GUIDELINES_PATH = process.env.GUIDELINES_PATH || join(__dirname, '../guidelines');

// Create server instance
const server = new Server(
  {
    name: 'coding-guidelines-server',
    version: '2.0.0',
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
  },
);

// Start server
async function main() {
  // Which documents are served comes from the manifest in GUIDELINES_PATH, so a
  // different guideline set is a different directory — no code change required.
  const guidelines = await loadGuidelines(GUIDELINES_PATH);

  registerResourceHandlers(server, GUIDELINES_PATH, guidelines);
  registerToolHandlers(server, GUIDELINES_PATH, guidelines);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `Coding Guidelines MCP Server running on stdio (${guidelines.length} guidelines from ${GUIDELINES_PATH})`,
  );
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
