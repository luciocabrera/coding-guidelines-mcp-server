/**
 * Tools Index
 * Exports all tools and the main handler registration
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { GENERATE_CODE_TOOL } from './generate-code/generate-code.const';
import type { GenerateCodeArgs, GenerateCodeResult } from './generate-code/generate-code.types';
import type { SearchGuidelinesArgs } from './search-guidelines/search-guidelines.types.js';
import { VALIDATE_CODE_PATTERN_TOOL } from './validate-code-pattern/validate-code-pattern.const.js';
import type { ValidateCodePatternArgs } from './validate-code-pattern/validate-code-pattern.types';
import { generateCode } from './generate-code';
import { GET_GUIDELINE_SUMMARY_TOOL, getGuidelineSummary } from './get-guideline-summary';
import { SEARCH_GUIDELINES_TOOL, searchGuidelines } from './search-guidelines';
import { validateCodePattern } from './validate-code-pattern';

// Export all tools for easy access
export const ALL_TOOLS = [
  SEARCH_GUIDELINES_TOOL,
  VALIDATE_CODE_PATTERN_TOOL,
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
    const { arguments: args, name } = request.params;

    switch (name) {
      case 'search_guidelines':
        return await searchGuidelines(guidelinesPath, args as SearchGuidelinesArgs);

      case 'validate_code_pattern':
        return validateCodePattern(args as ValidateCodePatternArgs);

      case 'get_guideline_summary':
        return await getGuidelineSummary(
          guidelinesPath,
          args as { guideline: string; section?: string },
        );

      case 'generate_code': {
        const result = generateCode(args as GenerateCodeArgs) as GenerateCodeResult;
        // Wrap into MCP response content while keeping files/commands in the envelope
        return {
          commands: result.commands,
          content: [{ text: result.text, type: 'text' }],
          files: result.files,
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}
