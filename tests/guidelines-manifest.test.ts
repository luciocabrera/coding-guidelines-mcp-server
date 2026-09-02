import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  loadGuidelines,
  loadManifest,
  MANIFEST_FILENAME,
} from '../src/config/guidelines-manifest.js';
import { DEFAULT_VALIDATION_RULES } from '../src/config/validation-rules.js';
import { ALT_GUIDELINES_PATH, FIXTURE_GUIDELINES_PATH } from './helpers.js';

/** Write a manifest with arbitrary contents into a throwaway directory. */
const manifestDir = async (contents: string): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), 'guidelines-manifest-'));
  await writeFile(join(dir, MANIFEST_FILENAME), contents, 'utf-8');
  return dir;
};

describe('guideline manifest', () => {
  it('loads every entry declared in the manifest', async () => {
    const guidelines = await loadGuidelines(FIXTURE_GUIDELINES_PATH);

    expect(guidelines).toHaveLength(5);
    expect(guidelines[0]).toEqual({
      uri: 'guidelines://coding-guidelines',
      name: 'Coding Guidelines',
      description: 'Comprehensive coding guidelines for React, TypeScript, StyleX',
      mimeType: 'text/markdown',
      file: 'coding-guidelines.md',
    });
  });

  it('loads a completely different guideline set from a different directory', async () => {
    const guidelines = await loadGuidelines(ALT_GUIDELINES_PATH);

    expect(guidelines).toHaveLength(2);
    expect(guidelines.map((g) => g.uri)).toEqual([
      'standards://python-style',
      'standards://api-design',
    ]);
  });

  it('defaults mimeType to text/markdown when omitted', async () => {
    const guidelines = await loadGuidelines(ALT_GUIDELINES_PATH);

    expect(guidelines.every((g) => g.mimeType === 'text/markdown')).toBe(true);
  });

  it('fails with an actionable message when the manifest is missing', async () => {
    await expect(loadGuidelines('/nonexistent/guidelines/path')).rejects.toThrow(
      /No guidelines\.config\.json found in/,
    );
  });

  it('fails when the manifest is not valid JSON', async () => {
    const dir = await manifestDir('{ not json');

    await expect(loadGuidelines(dir)).rejects.toThrow(/is not valid JSON/);
  });

  it('fails when the manifest has no guidelines array', async () => {
    const dir = await manifestDir(JSON.stringify({ docs: [] }));

    await expect(loadGuidelines(dir)).rejects.toThrow(
      /must be an object with a "guidelines" array/,
    );
  });

  it('fails when the manifest lists nothing', async () => {
    const dir = await manifestDir(JSON.stringify({ guidelines: [] }));

    await expect(loadGuidelines(dir)).rejects.toThrow(/lists no guidelines/);
  });

  it('names the offending entry and field when one is malformed', async () => {
    const dir = await manifestDir(
      JSON.stringify({
        guidelines: [
          { uri: 'a://b', name: 'Fine', description: 'ok', file: 'a.md' },
          { uri: 'a://c', name: 'Missing file', description: 'ok' },
        ],
      }),
    );

    await expect(loadGuidelines(dir)).rejects.toThrow(
      /guidelines\[1\]\.file must be a non-empty string/,
    );
  });

  it('rejects a file path that escapes the guidelines directory', async () => {
    const dir = await manifestDir(
      JSON.stringify({
        guidelines: [{ uri: 'a://b', name: 'Escape', description: 'ok', file: '../../etc/passwd' }],
      }),
    );

    await expect(loadGuidelines(dir)).rejects.toThrow(
      /must be a path inside the guidelines directory/,
    );
  });

  it('rejects an absolute file path', async () => {
    const dir = await manifestDir(
      JSON.stringify({
        guidelines: [{ uri: 'a://b', name: 'Absolute', description: 'ok', file: '/etc/passwd' }],
      }),
    );

    await expect(loadGuidelines(dir)).rejects.toThrow(
      /must be a path inside the guidelines directory/,
    );
  });

  it('allows a file in a subdirectory of the guidelines directory', async () => {
    const dir = await manifestDir(
      JSON.stringify({
        guidelines: [{ uri: 'a://b', name: 'Nested', description: 'ok', file: 'team/style.md' }],
      }),
    );

    const guidelines = await loadGuidelines(dir);
    expect(guidelines[0]?.file).toBe('team/style.md');
  });

  it('rejects duplicate names, which make get_guideline_summary ambiguous', async () => {
    const dir = await manifestDir(
      JSON.stringify({
        guidelines: [
          { uri: 'a://b', name: 'Same', description: 'ok', file: 'one.md' },
          { uri: 'a://c', name: 'Same', description: 'ok', file: 'two.md' },
        ],
      }),
    );

    await expect(loadGuidelines(dir)).rejects.toThrow(/declares the name "Same" more than once/);
  });

  it('rejects a whitespace-only pattern', async () => {
    const dir = await manifestDir(
      JSON.stringify({
        guidelines: [{ uri: 'a://b', name: 'One', description: 'ok', file: 'one.md' }],
        categories: { blank: { patterns: ['   '], advice: 'nope' } },
      }),
    );

    await expect(loadManifest(dir)).rejects.toThrow(
      /categories\.blank\.patterns must contain non-empty strings/,
    );
  });

  it('rejects duplicate URIs, which would silently shadow a document', async () => {
    const dir = await manifestDir(
      JSON.stringify({
        guidelines: [
          { uri: 'a://b', name: 'One', description: 'ok', file: 'one.md' },
          { uri: 'a://b', name: 'Two', description: 'ok', file: 'two.md' },
        ],
      }),
    );

    await expect(loadGuidelines(dir)).rejects.toThrow(/declares the uri "a:\/\/b" more than once/);
  });
});

describe('validation categories from the manifest', () => {
  it('uses the built-in rules when the manifest declares no categories', async () => {
    const { validationRules } = await loadManifest(FIXTURE_GUIDELINES_PATH);

    expect(Object.keys(validationRules).sort()).toEqual([
      'component',
      'file-structure',
      'styling',
      'testing',
      'types',
    ]);
  });

  it('adds manifest categories alongside the built-in ones', async () => {
    const { validationRules } = await loadManifest(ALT_GUIDELINES_PATH);

    // The built-ins survive, so a client prompting for 'component' still works...
    expect(validationRules.component).toBeDefined();
    expect(validationRules.styling).toBeDefined();
    // ...and the fixture's own taxonomy is available too.
    expect(validationRules.docstrings).toBeDefined();
    expect(validationRules['type-hints']).toBeDefined();
  });

  it('lets a manifest override a built-in category by name', async () => {
    const { validationRules } = await loadManifest(ALT_GUIDELINES_PATH);

    // 'types' exists by default with TypeScript advice; the fixture redefines it.
    expect(validationRules.types?.advice).toBe('Prefer TypedDict or dataclass over untyped dicts.');
    expect(DEFAULT_VALIDATION_RULES.types.advice).toContain("Prefer 'type' over 'interface'");
  });

  it('compiles manifest patterns into working regular expressions', async () => {
    const { validationRules } = await loadManifest(ALT_GUIDELINES_PATH);

    const docstrings = validationRules.docstrings;
    expect(docstrings?.patterns[0]?.test('"""Return the thing."""')).toBe(true);
    expect(docstrings?.antiPatterns[0]?.test('def thing(a, b):')).toBe(true);
  });

  it('does not mutate the built-in rules when a manifest overrides one', async () => {
    await loadManifest(ALT_GUIDELINES_PATH);

    expect(DEFAULT_VALIDATION_RULES.types.advice).toContain("Prefer 'type' over 'interface'");
  });

  it('rejects a category with an invalid regular expression, naming the field', async () => {
    const dir = await manifestDir(
      JSON.stringify({
        guidelines: [{ uri: 'a://b', name: 'One', description: 'ok', file: 'one.md' }],
        categories: { broken: { patterns: ['('], advice: 'nope' } },
      }),
    );

    await expect(loadManifest(dir)).rejects.toThrow(
      /categories\.broken\.patterns contains an invalid regular expression/,
    );
  });

  it('rejects a category with no advice', async () => {
    const dir = await manifestDir(
      JSON.stringify({
        guidelines: [{ uri: 'a://b', name: 'One', description: 'ok', file: 'one.md' }],
        categories: { thing: { patterns: ['x'] } },
      }),
    );

    await expect(loadManifest(dir)).rejects.toThrow(
      /categories\.thing\.advice must be a non-empty string/,
    );
  });

  it('rejects a category with no patterns at all, which would match nothing', async () => {
    const dir = await manifestDir(
      JSON.stringify({
        guidelines: [{ uri: 'a://b', name: 'One', description: 'ok', file: 'one.md' }],
        categories: { empty: { advice: 'says nothing' } },
      }),
    );

    await expect(loadManifest(dir)).rejects.toThrow(
      /categories\.empty needs at least one pattern or antiPattern/,
    );
  });
});
