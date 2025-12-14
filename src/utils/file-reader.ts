/**
 * File Reading Utilities
 * Functions for reading guideline files
 */

import { readSafeFile, validatePath } from './safe-file-reader';

type ReadGuidelineFileArgs = {
  filename: string;
  guidelinesPath: string;
};

/**
 * Read a guideline file content
 */
export const readGuidelineFile = async ({
  filename,
  guidelinesPath,
}: ReadGuidelineFileArgs): Promise<string> => {
  const validatedPath = validatePath({ basePath: guidelinesPath, filePath: filename });

  if (!validatedPath) {
    throw new Error(`Path traversal detected: ${filename}`);
  }

  try {
    return await readSafeFile(validatedPath);
  } catch {
    throw new Error(`Failed to read guideline file: ${filename}`);
  }
};
