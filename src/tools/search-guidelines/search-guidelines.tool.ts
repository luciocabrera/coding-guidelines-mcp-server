/**
 * Search Guidelines Tool
 * Searches for specific patterns across all guideline documents
 */

import { GUIDELINES } from '@/resources';

import type { SearchGuidelinesArgs, SearchResult } from './search-guidelines.types';

import { formatSearchResults, searchInGuideline } from './utils';

type SearchGuidelinesToolArgs = {
  args: SearchGuidelinesArgs;
  guidelinesPath: string;
};

export const searchGuidelines = async ({ args, guidelinesPath }: SearchGuidelinesToolArgs) => {
  const { query } = args;
  const results: SearchResult[] = [];

  for (const guideline of GUIDELINES) {
    const result = await searchInGuideline({ guideline, guidelinesPath, query });
    if (result) {
      results.push(result);
    }
  }

  return {
    content: [
      {
        text:
          results.length > 0 ? formatSearchResults({ results }) : `No results found for "${query}"`,
        type: 'text',
      },
    ],
  };
};
