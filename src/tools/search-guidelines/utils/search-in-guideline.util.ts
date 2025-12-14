import type { Guideline } from '@/types/common.types';

import { readSafeFile, validatePath } from '@/utils/safe-file-reader';

import type { SearchMatch, SearchResult } from '../search-guidelines.types';

type SearchInGuidelineArgs = {
  guideline: Guideline;
  guidelinesPath: string;
  query: string;
};

/**
 * Search for a query in a guideline file
 */
export const searchInGuideline = async ({
  guideline,
  guidelinesPath,
  query,
}: SearchInGuidelineArgs): Promise<SearchResult | undefined> => {
  try {
    const validatedPath = validatePath({ basePath: guidelinesPath, filePath: guideline.file });

    if (!validatedPath) {
      return undefined;
    }

    const content = await readSafeFile(validatedPath);
    const lines = content.split('\n');
    const matches: SearchMatch[] = lines
      .map((line, index) => ({ index, line }))
      .filter(({ line }) => line.toLowerCase().includes(query.toLowerCase()));

    if (matches.length > 0) {
      return { guideline, matches };
    }
    return undefined;
  } catch {
    // Silently skip files that can't be read
    return undefined;
  }
};
