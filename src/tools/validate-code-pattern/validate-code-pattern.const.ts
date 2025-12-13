import type { ValidationCategory, ValidationRule } from './validate-code-pattern.types';

export const VALIDATE_CODE_PATTERN_TOOL = {
  name: 'validate_code_pattern',
  description: 'Check if a code pattern follows the established guidelines',
  inputSchema: {
    type: 'object' as const,
    properties: {
      code: {
        type: 'string',
        description: 'Code snippet to validate',
      },
      category: {
        type: 'string',
        description: 'Category to validate against',
        enum: ['component', 'styling', 'types', 'testing', 'file-structure'] as const,
      },
    },
    required: ['code', 'category'],
  },
};

export const VALIDATION_RULES: Record<ValidationCategory, ValidationRule> = {
  component: {
    patterns: [/const\s+\w+\s*=\s*\(/],
    antiPatterns: [/React\.FC/, /function\s+\w+\(/, /\bforwardRef\s*\(/, /React\.forwardRef\s*\(/],
    advice: 'Components should use const arrow functions, not React.FC or function declarations',
  },
  styling: {
    patterns: [/\.styles\.ts/, /stylex\./],
    antiPatterns: [/\bstyle\s*=\s*{/, /className=/],
    advice: "Use StyleX for all styling. Avoid the JSX 'style' prop and avoid className props",
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
