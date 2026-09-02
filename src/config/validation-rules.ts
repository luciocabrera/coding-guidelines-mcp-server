/**
 * Default Validation Rules
 *
 * The categories this server ships with, encoding React/TypeScript/StyleX
 * opinions. A guidelines manifest can add categories or override any of these
 * by name — see the `categories` block in guidelines.config.json — so a fork
 * with a different taxonomy does not have to edit this file.
 */

import type { ValidationRule, BuiltInValidationCategory } from '../types.js';

export const DEFAULT_VALIDATION_RULES: Record<BuiltInValidationCategory, ValidationRule> = {
  component: {
    patterns: [/const\s+\w+\s*=\s*\(/],
    antiPatterns: [/React\.FC/, /function\s+\w+\(/],
    advice: 'Components should use const arrow functions, not React.FC or function declarations',
  },
  styling: {
    patterns: [/\.styles\.ts/, /stylex\./],
    antiPatterns: [/style={{/, /className=/],
    advice: 'Use StyleX for all styling. Avoid inline styles and className props',
  },
  types: {
    patterns: [/type\s+\w+\s*=/, /readonly/],
    antiPatterns: [/interface\s+\w+/, /var\s+/, /let\s+/],
    advice:
      "Prefer 'type' over 'interface', use 'readonly' for props, use 'const' instead of 'var' or 'let'",
  },
  testing: {
    patterns: [/describe\(/, /it\(/, /expect\(/],
    antiPatterns: [/\.only\(/, /\.skip\(/],
    advice:
      'Use proper test structure with describe/it blocks. Avoid .only() or .skip() in committed code',
  },
  'file-structure': {
    patterns: [/\.tsx?$/, /\.test\.tsx?$/],
    antiPatterns: [/\.jsx$/, /\.js$/],
    advice: 'Use TypeScript files (.ts/.tsx). Group related files in feature folders',
  },
};
