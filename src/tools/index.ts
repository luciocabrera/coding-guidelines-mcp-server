/**
 * Tools Index
 * Exports all tools and the main handler registration
 */

import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type {
  SearchGuidelinesArgs,
  ValidateCodePatternArgs,
  GenerateCodeResult,
} from '../types.js';

import { searchGuidelinesTool, handleSearchGuidelines } from './search-guidelines.tool.js';
import {
  validateCodePatternTool,
  handleValidateCodePattern,
} from './validate-code-pattern.tool.js';
import {
  getGuidelineSummaryTool,
  handleGetGuidelineSummary,
} from './get-guideline-summary.tool.js';
import { generateCodeTool, handleGenerateCode } from './generate-code.tool.js';

// Export all tools for easy access
export const ALL_TOOLS = [
  searchGuidelinesTool,
  validateCodePatternTool,
  getGuidelineSummaryTool,
  generateCodeTool,
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
        return await handleSearchGuidelines(guidelinesPath, args as SearchGuidelinesArgs);

      case 'validate_code_pattern':
        return handleValidateCodePattern(args as ValidateCodePatternArgs);

      case 'get_guideline_summary':
        return await handleGetGuidelineSummary(
          guidelinesPath,
          args as { guideline: string; section?: string },
        );

      case 'generate_code': {
        const result = handleGenerateCode(args as any) as GenerateCodeResult;
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
