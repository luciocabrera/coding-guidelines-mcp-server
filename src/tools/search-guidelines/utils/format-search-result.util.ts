import type { SearchResult } from '../search-guidelines.types';

/**
 * Format search results for display
 */
export function formatSearchResults(
  results: SearchResult[],
  maxMatchesPerFile: number = 5,
): string {
  if (results.length === 0) {
    return 'No results found';
  }

  const formatted: string[] = [];

  for (const { guideline, matches } of results) {
    formatted.push(`\n**${guideline.name}** (${guideline.file}):`);

    const displayMatches = matches.slice(0, maxMatchesPerFile);
    displayMatches.forEach(({ index, line }) => {
      formatted.push(`Line ${index + 1}: ${line.trim()}`);
    });

    if (matches.length > maxMatchesPerFile) {
      formatted.push(`... and ${matches.length - maxMatchesPerFile} more matches`);
    }
  }

  return `Found results in ${results.length} documents:\n${formatted.join('\n')}`;
}
