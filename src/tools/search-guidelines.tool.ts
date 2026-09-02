/**
 * Search Guidelines Tool
 * Searches for specific patterns across all guideline documents
 */

import type { Guideline, SearchGuidelinesArgs, SearchResult } from '../types.js';
import { searchInGuideline, formatSearchResults } from '../utils/index.js';

export const searchGuidelinesTool = {
  name: 'search_guidelines',
  description: 'Search for specific coding guidelines or patterns across all documents',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: "Search query (e.g., 'StyleX', 'testing', 'TypeScript')",
      },
    },
    required: ['query'],
  },
};

export async function handleSearchGuidelines(
  guidelinesPath: string,
  guidelines: readonly Guideline[],
  args: SearchGuidelinesArgs,
) {
  const { query } = args;
  const results: SearchResult[] = [];

  for (const guideline of guidelines) {
    const result = await searchInGuideline(guidelinesPath, guideline, query);
    if (result) {
      results.push(result);
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: results.length > 0 ? formatSearchResults(results) : `No results found for "${query}"`,
      },
    ],
  };
}
