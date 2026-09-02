import { describe, expect, it } from 'vitest';

import { handleGetGuidelineSummary } from '../src/tools/get-guideline-summary.tool.js';
import { FIXTURE_GUIDELINES_PATH, textOf } from './helpers.js';

const summary = async (guideline: string, section?: string) =>
  textOf(await handleGetGuidelineSummary(FIXTURE_GUIDELINES_PATH, { guideline, section }));

describe('get_guideline_summary', () => {
  it('returns the opening of a document when no section is given', async () => {
    const result = await summary('Testing Guide');

    expect(result).toContain('**Testing Guide**');
    expect(result).toContain('Sample Testing Guide');
    expect(result).toContain('use section parameter');
  });

  it('extracts a single named section', async () => {
    const result = await summary('Testing Guide', 'Integration tests');

    expect(result).toContain('## Integration tests');
    expect(result).toContain('Drive the real module boundary.');
    expect(result).not.toContain('## Unit tests');
  });

  it('keeps nested subsections inside the section that contains them', async () => {
    const result = await summary('Testing Guide', 'Unit tests');

    // Regression: the boundary check used startsWith('#'.repeat(level)), which also
    // matches deeper headings, so '## Unit tests' used to be cut off at '### Coverage'.
    expect(result).toContain('### Coverage');
    expect(result).toContain('Aim for meaningful coverage');
    // ...but must still stop at the next sibling heading.
    expect(result).not.toContain('## Integration tests');
  });

  it('reports an unknown guideline and lists the available ones', async () => {
    const result = await summary('Nonexistent Guide');

    expect(result).toContain('Guideline not found: Nonexistent Guide');
    expect(result).toContain('Coding Guidelines');
  });

  it('reports a section that is not in the document', async () => {
    const result = await summary('Testing Guide', 'Deployment');

    expect(result).toBe('Section "Deployment" not found in Testing Guide');
  });

  it('rejects a guideline whose file is missing from the guidelines path', async () => {
    await expect(
      handleGetGuidelineSummary('/nonexistent/guidelines/path', { guideline: 'Testing Guide' }),
    ).rejects.toThrow(/Failed to read guideline file/);
  });
});
