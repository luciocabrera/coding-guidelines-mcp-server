/**
 * Tools Index
 * Exports all tools and the main handler registration
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import type { SearchGuidelinesArgs, ValidateCodePatternArgs } from '../types.js';

import { GENERATE_CODE_TOOL } from './generate-code/generate-code.const.js';
import { type GenerateCodeArgs, type GenerateCodeResult } from './generate-code/generate-code.types.js';
import { SEARCH_GUIDELINES_TOOL } from './search-guidelines/search-guidelines.const.js';
import { searchGuidelines } from './search-guidelines/search-guidelines.tool.js';
import { generateCode } from './generate-code';
import { getGuidelineSummary } from './get-guideline-summary';
import { GET_GUIDELINE_SUMMARY_TOOL } from './get-guideline-summary';
import {
  handleValidateCodePattern,
  validateCodePatternTool,
} from './validate-code-pattern.tool.js';

// Export all tools for easy access
export const ALL_TOOLS = [
  SEARCH_GUIDELINES_TOOL,
  validateCodePatternTool,
  GET_GUIDELINE_SUMMARY_TOOL,
  GENERATE_CODE_TOOL,
];

/**
 * Register all tool handlers with the MCP server
 */
export function registerToolHandlers(server: Server, guidelinesPath: string): void {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, () => {
    return {
      tools: ALL_TOOLS,
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'search_guidelines':
        return await searchGuidelines(guidelinesPath, args as SearchGuidelinesArgs);

      case 'validate_code_pattern':
        return handleValidateCodePattern(args as ValidateCodePatternArgs);

      case 'get_guideline_summary':
        return await getGuidelineSummary(
          guidelinesPath,
          args as { guideline: string; section?: string },
        );

      case 'generate_code': {
        const result = generateCode(args as GenerateCodeArgs) as GenerateCodeResult;
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
