/**
 * Search Guidelines Tool
 * Searches for specific patterns across all guideline documents
 */

import { GUIDELINES } from '../../resources/index.js';
import type { SearchGuidelinesArgs, SearchResult } from '../../types.js';
import { formatSearchResults, searchInGuideline } from '../../utils/index.js';

export async function searchGuidelines(guidelinesPath: string, args: SearchGuidelinesArgs) {
  const { query } = args;
  const results: SearchResult[] = [];

  for (const guideline of GUIDELINES) {
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
