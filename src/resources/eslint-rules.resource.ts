/**
 * ESLint Rules Resource
 * Quick reference / pointer to the workspace ESLint configuration
 */

import type { Guideline } from '../types.js';

export const eslintRulesResource: Guideline = {
  uri: 'guidelines://eslint-rules',
  name: 'ESLint Rules Quick Reference',
  description: 'Quick reference for the repo ESLint rules (see eslint.config.mjs)',
  mimeType: 'text/markdown',
  file: 'eslint-rules.md',
};
