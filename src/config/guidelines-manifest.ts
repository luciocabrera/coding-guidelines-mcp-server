/**
 * Guideline Manifest
 *
 * The set of guideline documents this server exposes is data, not code: each
 * guidelines directory carries its own `guidelines.config.json` describing what
 * lives in it. Pointing GUIDELINES_PATH at a different directory swaps the whole
 * guideline set without touching src/.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

import type { Guideline } from '../types.js';

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

const requireString = (value: unknown, field: string, index: number): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `${MANIFEST_FILENAME} is invalid: guidelines[${index}].${field} must be a non-empty string`,
    );
  }
  return value;
};

/**
 * Read and validate the manifest in `guidelinesPath`.
 *
 * Throws with an actionable message rather than returning a partial set — a
 * mistyped filename should fail at startup, not silently drop a resource.
 */
export async function loadGuidelines(guidelinesPath: string): Promise<Guideline[]> {
  const manifestPath = join(guidelinesPath, MANIFEST_FILENAME);

  let raw: string;
  try {
    raw = await readFile(manifestPath, 'utf-8');
  } catch {
    throw new Error(
      `No ${MANIFEST_FILENAME} found in ${guidelinesPath}. ` +
        `Every guidelines directory needs one; see TEMPLATE.md.`,
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
      file: requireString(candidate.file, 'file', index),
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

  return guidelines;
}
