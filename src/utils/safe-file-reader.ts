/**
 * Safe File Reading Utilities
 * Standard 011: Safe File System Operations
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * A validated safe file path that has been checked for traversal attacks
 * This nominal type prevents accidental use of unvalidated paths
 */
type ValidatedPath = string & { readonly _validated: unique symbol };

type ValidatePathArgs = {
  basePath: string;
  filePath: string;
};

/**
 * Validates a file path is within the allowed base directory
 * Returns a ValidatedPath that can be safely used with readSafeFile
 */
export const validatePath = ({
  basePath,
  filePath,
}: ValidatePathArgs): undefined | ValidatedPath => {
  const resolvedBase = path.resolve(basePath);
  const resolvedPath = path.resolve(basePath, filePath);

  // Ensure the resolved path is within the base directory
  if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
    return undefined;
  }

  return resolvedPath as ValidatedPath;
};

/**
 * Reads a file that has been validated to be safe
 * Only accepts ValidatedPath to ensure the path has been checked
 *
 * This is the ONLY place in the codebase where we read files with dynamic paths.
 * The ValidatedPath nominal type ensures all paths have been validated before reaching here.
 * The security warning is intentionally suppressed because:
 * 1. ValidatedPath can only be created by validatePath() which checks for path traversal
 * 2. This centralizes the security-sensitive operation in one controlled location
 * 3. All callers must use validatePath() first - TypeScript enforces this at compile time
 */
export const readSafeFile = async (validatedPath: ValidatedPath): Promise<string> => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is validated via ValidatedPath nominal type, see function documentation
  return await readFile(validatedPath, 'utf8');
};
