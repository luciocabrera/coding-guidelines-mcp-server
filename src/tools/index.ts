/**
 * Tools
 * Exports the tool set and registers the MCP tool handlers.
 */

import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

import type {
  Guideline,
  SearchGuidelinesArgs,
  ValidateCodePatternArgs,
  GenerateCodeArgs,
  GenerateCodeResult,
} from '../types.js';

import { searchGuidelinesTool, handleSearchGuidelines } from './search-guidelines.tool.js';
import {
  validateCodePatternTool,
  handleValidateCodePattern,
} from './validate-code-pattern.tool.js';
import {
  createGetGuidelineSummaryTool,
  handleGetGuidelineSummary,
} from './get-guideline-summary.tool.js';
import { generateCodeTool, handleGenerateCode } from './generate-code.tool.js';

/**
 * Build the tool list for a given guideline set. get_guideline_summary
 * enumerates the loaded document names in its schema, so the list depends on
 * the manifest rather than being a module-level constant.
 */
export const buildTools = (guidelines: readonly Guideline[]) => [
  searchGuidelinesTool,
  validateCodePatternTool,
  createGetGuidelineSummaryTool(guidelines),
  generateCodeTool,
];

/**
 * Register all tool handlers with the MCP server
 */
export function registerToolHandlers(
  server: Server,
  guidelinesPath: string,
  guidelines: readonly Guideline[],
): void {
  const tools = buildTools(guidelines);

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, () => {
    return { tools };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'search_guidelines':
        return await handleSearchGuidelines(
          guidelinesPath,
          guidelines,
          args as SearchGuidelinesArgs,
        );

      case 'validate_code_pattern':
        return handleValidateCodePattern(args as ValidateCodePatternArgs);

      case 'get_guideline_summary':
        return await handleGetGuidelineSummary(
          guidelinesPath,
          guidelines,
          args as { guideline: string; section?: string },
        );

      case 'generate_code': {
        const result: GenerateCodeResult = handleGenerateCode(args as unknown as GenerateCodeArgs);
        // Wrap into MCP response content while keeping files/commands in the envelope
        return {
          content: [{ type: 'text', text: result.text }],
          files: result.files,
          commands: result.commands,
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}
