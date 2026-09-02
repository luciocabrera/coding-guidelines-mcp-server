/**
 * Resources
 * Exposes each guideline document in the loaded manifest as an MCP resource.
 */

import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

import type { Guideline } from '../types.js';
import { readGuidelineFile } from '../utils/index.js';

/**
 * Register resource handlers with the MCP server.
 *
 * `guidelines` comes from the manifest in the guidelines directory, so which
 * documents are served is decided by configuration rather than by this module.
 */
export function registerResourceHandlers(
  server: Server,
  guidelinesPath: string,
  guidelines: readonly Guideline[],
): void {
  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, () => {
    return {
      resources: guidelines.map(({ uri, name, description, mimeType }) => ({
        uri,
        name,
        description,
        mimeType,
      })),
    };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const guideline = guidelines.find((g) => g.uri === request.params.uri);

    if (!guideline) {
      throw new Error(`Resource not found: ${request.params.uri}`);
    }

    const content = await readGuidelineFile(guidelinesPath, guideline.file);

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: guideline.mimeType,
          text: content,
        },
      ],
    };
  });
}
