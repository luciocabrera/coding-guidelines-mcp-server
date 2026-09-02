import { describe, expect, it } from 'vitest';

import { handleSearchGuidelines } from '../src/tools/search-guidelines.tool.js';
import { FIXTURE_GUIDELINES_PATH, textOf } from './helpers.js';

const search = async (query: string) =>
  textOf(await handleSearchGuidelines(FIXTURE_GUIDELINES_PATH, { query }));

describe('search_guidelines', () => {
  it('finds an exact term and reports the documents it appears in', async () => {
    const result = await search('StyleX');

    expect(result).toContain('Found results in 2 documents');
    expect(result).toContain('Coding Guidelines');
    expect(result).toContain('Enterprise Coding Standards');
  });

  it('matches on a partial term, since search is substring-based', async () => {
    const result = await search('Style');

    // 'Style' is not a whole word in the fixtures; it only matches inside 'StyleX'.
    expect(result).toContain('Found results in 2 documents');
    expect(result).toContain('StyleX');
  });

  it('reports no results for a term that appears nowhere', async () => {
    const result = await search('kubernetes');

    expect(result).toBe('No results found for "kubernetes"');
  });

  it('is case insensitive', async () => {
    const [lower, upper, mixed] = await Promise.all([
      search('stylex'),
      search('STYLEX'),
      search('StYlEx'),
    ]);

    expect(lower).toBe(upper);
    expect(upper).toBe(mixed);
    expect(lower).toContain('Found results in 2 documents');
  });

  it('reports the line number each match was found on', async () => {
    const result = await search('Playwright');

    // The fixture has 'Playwright' as a heading and again in the body.
    expect(result).toContain('E2E Testing Guide');
    expect(result).toMatch(/Line \d+:/);
  });

  it('returns no results rather than throwing when the guidelines path is missing', async () => {
    const result = textOf(
      await handleSearchGuidelines('/nonexistent/guidelines/path', { query: 'StyleX' }),
    );

    expect(result).toBe('No results found for "StyleX"');
  });
});
