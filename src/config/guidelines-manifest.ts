/**
 * Guideline Manifest
 *
 * The set of guideline documents this server exposes is data, not code: each
 * guidelines directory carries its own `guidelines.config.json` describing what
 * lives in it. Pointing GUIDELINES_PATH at a different directory swaps the whole
 * guideline set without touching src/.
 */

import { readFile } from 'fs/promises';
import { isAbsolute, join, relative, resolve } from 'path';

import type { Guideline, ValidationRule, ValidationRules } from '../types.js';
import { DEFAULT_VALIDATION_RULES } from './validation-rules.js';

/** Filename of the manifest expected inside every guidelines directory. */
export const MANIFEST_FILENAME = 'guidelines.config.json';

const DEFAULT_MIME_TYPE = 'text/markdown';

type RawGuideline = {
  uri?: unknown;
  name?: unknown;
  description?: unknown;
  mimeType?: unknown;
  file?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Reject a `file` that escapes the guidelines directory.
 *
 * Manifests are configuration, but a guideline set can travel between people —
 * a `file` of "../../.ssh/id_rsa" would otherwise turn resources/read into an
 * arbitrary-file-read primitive for anyone who can get a manifest adopted.
 */
const requireContainedFile = (file: string, guidelinesPath: string, index: number): string => {
  const root = resolve(guidelinesPath);
  const target = resolve(root, file);
  const rel = relative(root, target);
  if (isAbsolute(file) || rel === '' || rel.startsWith('..')) {
    throw new Error(
      `${MANIFEST_FILENAME} is invalid: guidelines[${index}].file ${JSON.stringify(file)} ` +
        `must be a path inside the guidelines directory`,
    );
  }
  return file;
};

const requireString = (value: unknown, field: string, index: number): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `${MANIFEST_FILENAME} is invalid: guidelines[${index}].${field} must be a non-empty string`,
    );
  }
  return value;
};

/** Compile one regex from the manifest, naming the category if it is invalid. */
const compilePattern = (pattern: unknown, category: string, field: string): RegExp => {
  if (typeof pattern !== 'string' || pattern.trim() === '') {
    throw new Error(
      `${MANIFEST_FILENAME} is invalid: categories.${category}.${field} must contain non-empty strings`,
    );
  }
  try {
    return new RegExp(pattern);
  } catch (error) {
    throw new Error(
      `${MANIFEST_FILENAME} is invalid: categories.${category}.${field} contains an invalid ` +
        `regular expression ${JSON.stringify(pattern)}: ` +
        `${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};

const compilePatternList = (value: unknown, category: string, field: string): RegExp[] => {
  if (!Array.isArray(value)) {
    throw new Error(
      `${MANIFEST_FILENAME} is invalid: categories.${category}.${field} must be an array of strings`,
    );
  }
  return value.map((pattern) => compilePattern(pattern, category, field));
};

/**
 * Parse the optional `categories` block and merge it over the built-in rules.
 *
 * Merging rather than replacing keeps validate_code_pattern's advertised enum
 * stable for clients that already prompt against the shipped categories, while
 * letting a fork add its own taxonomy or redefine one by name.
 */
function parseValidationRules(raw: unknown): ValidationRules {
  if (raw === undefined) {
    return { ...DEFAULT_VALIDATION_RULES };
  }
  if (!isRecord(raw)) {
    throw new Error(`${MANIFEST_FILENAME} is invalid: "categories" must be an object`);
  }

  const merged: ValidationRules = { ...DEFAULT_VALIDATION_RULES };

  for (const [category, definition] of Object.entries(raw)) {
    if (!isRecord(definition)) {
      throw new Error(`${MANIFEST_FILENAME} is invalid: categories.${category} must be an object`);
    }
    if (typeof definition.advice !== 'string' || definition.advice.trim() === '') {
      throw new Error(
        `${MANIFEST_FILENAME} is invalid: categories.${category}.advice must be a non-empty string`,
      );
    }

    const rule: ValidationRule = {
      patterns: compilePatternList(definition.patterns ?? [], category, 'patterns'),
      antiPatterns: compilePatternList(definition.antiPatterns ?? [], category, 'antiPatterns'),
      advice: definition.advice,
    };

    if (rule.patterns.length === 0 && rule.antiPatterns.length === 0) {
      throw new Error(
        `${MANIFEST_FILENAME} is invalid: categories.${category} needs at least one pattern or antiPattern`,
      );
    }

    merged[category] = rule;
  }

  return merged;
}

/** Everything a server instance needs from a guidelines directory. */
export type GuidelinesConfig = {
  guidelines: Guideline[];
  validationRules: ValidationRules;
};

/**
 * Read and validate the manifest in `guidelinesPath`.
 *
 * Throws with an actionable message rather than returning a partial set — a
 * mistyped filename should fail at startup, not silently drop a resource.
 */
export async function loadManifest(guidelinesPath: string): Promise<GuidelinesConfig> {
  const manifestPath = join(guidelinesPath, MANIFEST_FILENAME);

  let raw: string;
  try {
    raw = await readFile(manifestPath, 'utf-8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      throw new Error(
        `No ${MANIFEST_FILENAME} found in ${guidelinesPath}. ` +
          `Every guidelines directory needs one; see TEMPLATE.md.`,
        { cause: error },
      );
    }
    // Permission problems, a directory where a file was expected, and so on —
    // reporting these as "not found" sends people looking for the wrong bug.
    throw new Error(
      `Could not read ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `${manifestPath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.guidelines)) {
    throw new Error(`${manifestPath} must be an object with a "guidelines" array`);
  }

  if (parsed.guidelines.length === 0) {
    throw new Error(`${manifestPath} lists no guidelines`);
  }

  const guidelines = parsed.guidelines.map((entry: unknown, index: number): Guideline => {
    if (!isRecord(entry)) {
      throw new Error(`${MANIFEST_FILENAME} is invalid: guidelines[${index}] must be an object`);
    }
    const candidate = entry as RawGuideline;
    return {
      uri: requireString(candidate.uri, 'uri', index),
      name: requireString(candidate.name, 'name', index),
      description: requireString(candidate.description, 'description', index),
      file: requireContainedFile(
        requireString(candidate.file, 'file', index),
        guidelinesPath,
        index,
      ),
      mimeType:
        candidate.mimeType === undefined
          ? DEFAULT_MIME_TYPE
          : requireString(candidate.mimeType, 'mimeType', index),
    };
  });

  const duplicateUri = guidelines.find(
    (guideline, index) => guidelines.findIndex((other) => other.uri === guideline.uri) !== index,
  );
  if (duplicateUri) {
    throw new Error(`${manifestPath} declares the uri "${duplicateUri.uri}" more than once`);
  }

  // get_guideline_summary keys off name, and publishes the list as its input
  // schema enum, so duplicates make the tool's contract ambiguous.
  const duplicateName = guidelines.find(
    (guideline, index) => guidelines.findIndex((other) => other.name === guideline.name) !== index,
  );
  if (duplicateName) {
    throw new Error(`${manifestPath} declares the name "${duplicateName.name}" more than once`);
  }

  return { guidelines, validationRules: parseValidationRules(parsed.categories) };
}

/** Convenience wrapper for callers that only need the document list. */
export async function loadGuidelines(guidelinesPath: string): Promise<Guideline[]> {
  return (await loadManifest(guidelinesPath)).guidelines;
}
