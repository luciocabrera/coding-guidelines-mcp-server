/**
 * Resources Index
 * Exports all resources and the main handler registration
 */

import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Guideline } from '../types.js';
import { readGuidelineFile } from '../utils/index.js';

import { codingGuidelinesResource } from './coding-guidelines.resource.js';
import { enterpriseStandardsResource } from './enterprise-standards.resource.js';
import { testingGuideResource } from './testing-guide.resource.js';
import { e2eTestingResource } from './e2e-testing.resource.js';
import { completeSetupResource } from './complete-setup.resource.js';

// Export all guidelines for easy access
export const GUIDELINES: Guideline[] = [
  codingGuidelinesResource,
  enterpriseStandardsResource,
  testingGuideResource,
  e2eTestingResource,
  completeSetupResource,
];

/**
 * Register resource handlers with the MCP server
 */
export function registerResourceHandlers(server: Server, guidelinesPath: string): void {
  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, () => {
    return {
      resources: GUIDELINES.map(({ uri, name, description, mimeType }) => ({
        uri,
        name,
        description,
        mimeType,
      })),
    };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const guideline = GUIDELINES.find((g) => g.uri === request.params.uri);

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
