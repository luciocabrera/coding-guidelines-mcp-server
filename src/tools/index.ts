/**
 * Tools Index
 * Exports all tools and the main handler registration
 */

// We use Server (not McpServer) for low-level setRequestHandler API
// McpServer is designed for high-level registerResource/registerTool APIs

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import type { GenerateCodeArgs, GenerateCodeResult } from './generate-code/generate-code.types';
import type { SearchGuidelinesArgs } from './search-guidelines/search-guidelines.types.js';
import type { ValidateCodePatternArgs } from './validate-code-pattern/validate-code-pattern.types';

import { generateCode } from './generate-code';
import { GENERATE_CODE_TOOL } from './generate-code/generate-code.const';
import { GET_GUIDELINE_SUMMARY_TOOL, getGuidelineSummary } from './get-guideline-summary';
import { SEARCH_GUIDELINES_TOOL, searchGuidelines } from './search-guidelines';
import { validateCodePattern } from './validate-code-pattern';
import { VALIDATE_CODE_PATTERN_TOOL } from './validate-code-pattern/validate-code-pattern.const.js';

// Export all tools for easy access
export const ALL_TOOLS = [
  SEARCH_GUIDELINES_TOOL,
  VALIDATE_CODE_PATTERN_TOOL,
  GET_GUIDELINE_SUMMARY_TOOL,
  GENERATE_CODE_TOOL,
];

type RegisterToolHandlersArgs = {
  guidelinesPath: string;
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  server: Server;
};

/**
 * Register all tool handlers with the MCP server
 */
export const registerToolHandlers = ({
  guidelinesPath,
  server,
}: RegisterToolHandlersArgs): void => {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, () => {
    return {
      tools: ALL_TOOLS,
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { args, name } = request.params;

    switch (name) {
      case 'generate_code': {
        const result = generateCode(args as GenerateCodeArgs) as GenerateCodeResult;
        // Wrap into MCP response content while keeping files/commands in the envelope
        return {
          commands: result.commands,
          content: [{ text: result.text, type: 'text' }],
          files: result.files,
        };
      }

      case 'get_guideline_summary': {
        return await getGuidelineSummary({
          args: args as { guideline: string; section?: string },
          guidelinesPath,
        });
      }

      case 'search_guidelines': {
        return await searchGuidelines({
          args: args as SearchGuidelinesArgs,
          guidelinesPath,
        });
      }

      case 'validate_code_pattern': {
        return validateCodePattern(args as ValidateCodePatternArgs);
      }

      default: {
        throw new Error(`Unknown tool: ${name}`);
      }
    }
  });
};
