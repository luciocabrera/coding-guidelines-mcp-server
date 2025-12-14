import type { ValidationCategory, ValidationRule } from './validate-code-pattern.types';

export const VALIDATE_CODE_PATTERN_TOOL = {
  description: 'Check if a code pattern follows the established guidelines',
  inputSchema: {
    properties: {
      category: {
        description: 'Category to validate against',
        enum: ['component', 'styling', 'types', 'testing', 'file-structure'] as const,
        type: 'string',
      },
      code: {
        description: 'Code snippet to validate',
        type: 'string',
      },
    },
    required: ['code', 'category'],
    type: 'object' as const,
  },
  name: 'validate_code_pattern',
};

export const VALIDATION_RULES: Record<ValidationCategory, ValidationRule> = {
  component: {
    advice: 'Components should use const arrow functions, not React.FC or function declarations',
    antiPatterns: [/React\.FC/, /function\s+\w+\(/, /\bforwardRef\s*\(/, /React\.forwardRef\s*\(/],
    patterns: [/const\s+\w+\s*=\s*\(/],
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'file-structure': {
    advice: 'Use TypeScript files (.ts/.tsx). Group related files in feature folders',
    antiPatterns: [/\.jsx$/, /\.js$/],
    patterns: [/\.tsx?$/, /\.test\.tsx?$/],
  },
  styling: {
    advice: "Use StyleX for all styling. Avoid the JSX 'style' prop and avoid className props",
    antiPatterns: [/\bstyle\s*=\s*{/, /className=/],
    patterns: [/\.styles\.ts/, /stylex\./],
  },
  testing: {
    advice:
      'Use proper test structure with describe/it blocks. Avoid .only() or .skip() in committed code',
    antiPatterns: [/\.only\(/, /\.skip\(/],
    patterns: [/describe\(/, /it\(/, /expect\(/],
  },
  types: {
    advice:
      "Prefer 'type' over 'interface', use 'readonly' for props, use 'const' instead of 'var' or 'let'",
    antiPatterns: [/interface\s+\w+/, /var\s+/, /let\s+/],
    patterns: [/type\s+\w+\s*=/, /readonly/],
  },
};
