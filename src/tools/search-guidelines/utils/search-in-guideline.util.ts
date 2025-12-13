import { readFile } from 'fs/promises';
import { join } from 'path';

import type { Guideline } from '@/types/common.types';

import type { SearchMatch, SearchResult } from '../search-guidelines.types';

/**
 * Search for a query in a guideline file
 */
export async function searchInGuideline(
  guidelinesPath: string,
  guideline: Guideline,
  query: string,
): Promise<SearchResult | null> {
  try {
    const content = await readFile(join(guidelinesPath, guideline.file), 'utf-8');
    const lines = content.split('\n');
    const matches: SearchMatch[] = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.toLowerCase().includes(query.toLowerCase()));

    if (matches.length > 0) {
      return { guideline, matches };
    }
    return null;
  } catch {
    // Silently skip files that can't be read
    return null;
  }
}
