import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

/** Guideline set used by the unit tests — small, controlled, and not the real docs. */
export const FIXTURE_GUIDELINES_PATH = join(here, 'fixtures', 'guidelines');

/** Repository root, for locating the built server. */
export const REPO_ROOT = join(here, '..');

type ToolResponse = { content: Array<{ type: string; text: string }> };

/** Tool handlers all return MCP content envelopes; this pulls out the text. */
export const textOf = (response: ToolResponse): string => {
  const first = response.content[0];
  if (!first) {
    throw new Error('tool response had no content');
  }
  return first.text;
};
