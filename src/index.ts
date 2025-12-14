#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-deprecated */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { registerResourceHandlers } from './resources/index.js';
import { registerToolHandlers } from './tools/index.js';

const FILE_NAME = fileURLToPath(import.meta.url);

const DIR_NAME = path.dirname(FILE_NAME);

// Path to the guidelines folder containing coding guidelines
const GUIDELINES_PATH = process.env.GUIDELINES_PATH ?? path.join(DIR_NAME, '../guidelines');

// Create server instance
const server = new Server(
  {
    name: 'coding-guidelines-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        listChanged: true,
      },
      tools: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        listChanged: true,
      },
    },
  },
);

// Register all handlers
registerResourceHandlers({ guidelinesPath: GUIDELINES_PATH, server });
registerToolHandlers({ guidelinesPath: GUIDELINES_PATH, server });

// Start server with top-level await (Standard 014)
try {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Coding Guidelines MCP Server running on stdio');
} catch (error: unknown) {
  console.error('Fatal error in main():', error);
  process.exit(1);
}
