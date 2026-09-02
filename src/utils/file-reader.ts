/**
 * File Reading Utilities
 * Functions for reading guideline files
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Read a guideline file content
 */
export async function readGuidelineFile(guidelinesPath: string, filename: string): Promise<string> {
  try {
    return await readFile(join(guidelinesPath, filename), 'utf-8');
  } catch {
    throw new Error(`Failed to read guideline file: ${filename}`);
  }
}
