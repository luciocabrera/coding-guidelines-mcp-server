import type { SearchResult } from '../search-guidelines.types';

type FormatSearchResultsArgs = {
  maxMatchesPerFile?: number;
  results: SearchResult[];
};

/**
 * Format search results for display
 */
export const formatSearchResults = ({
  maxMatchesPerFile = 5,
  results,
}: FormatSearchResultsArgs): string => {
  if (results.length === 0) {
    return 'No results found';
  }

  const formatted: string[] = [];

  for (const { guideline, matches } of results) {
    formatted.push(`\n**${guideline.name}** (${guideline.file}):`);

    const displayMatches = matches.slice(0, maxMatchesPerFile);
    for (const { index, line } of displayMatches) {
      formatted.push(`Line ${(index + 1).toString()}: ${line.trim()}`);
    }

    if (matches.length > maxMatchesPerFile) {
      formatted.push(`... and ${(matches.length - maxMatchesPerFile).toString()} more matches`);
    }
  }

  return `Found results in ${results.length.toString()} documents:\n${formatted.join('\n')}`;
};
