#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadManifest } from './config/guidelines-manifest.js';
import { registerResourceHandlers } from './resources/index.js';
import { registerToolHandlers } from './tools/index.js';

/**
 * Replaced by esbuild at build time with the version from package.json, so the
 * version reported over MCP cannot drift from the package. Declared with a
 * fallback so the module still runs untransformed (vitest, ts-node).
 */
declare const __SERVER_VERSION__: string | undefined;
const SERVER_VERSION = typeof __SERVER_VERSION__ === 'string' ? __SERVER_VERSION__ : '0.0.0-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the guidelines folder containing coding guidelines
const GUIDELINES_PATH = process.env.GUIDELINES_PATH || join(__dirname, '../guidelines');

// Create server instance
const server = new Server(
  {
    name: 'coding-guidelines-server',
    version: SERVER_VERSION,
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
  const { guidelines, validationRules } = await loadManifest(GUIDELINES_PATH);

  registerResourceHandlers(server, GUIDELINES_PATH, guidelines);
  registerToolHandlers(server, GUIDELINES_PATH, guidelines, validationRules);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `Coding Guidelines MCP Server running on stdio (${guidelines.length} guidelines, ` +
      `${Object.keys(validationRules).length} validation categories, from ${GUIDELINES_PATH})`,
  );
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
