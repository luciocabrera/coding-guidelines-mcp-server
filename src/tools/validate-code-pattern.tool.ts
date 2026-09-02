/**
 * Validate Code Pattern Tool
 * Validates code snippets against the loaded category rules.
 */

import type { ValidateCodePatternArgs, ValidationRules } from '../types.js';

/**
 * The advertised categories depend on the loaded rules, so the tool definition
 * is built per server rather than declared as a module-level constant.
 */
export const createValidateCodePatternTool = (rules: ValidationRules) => ({
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
        enum: Object.keys(rules),
      },
    },
    required: ['code', 'category'],
  },
});

export function handleValidateCodePattern(rules: ValidationRules, args: ValidateCodePatternArgs) {
  const { code, category } = args;

  const rule = rules[category];
  if (!rule) {
    return {
      content: [
        {
          type: 'text',
          text: `Unknown category: ${category}. Valid categories: ${Object.keys(rules).join(', ')}`,
        },
      ],
    };
  }

  const hasGoodPattern = rule.patterns.some((p) => p.test(code));
  const hasAntiPattern = rule.antiPatterns.some((p) => p.test(code));

  let result = `**Validation for ${category}:**\n\n`;
  if (hasGoodPattern && !hasAntiPattern) {
    result += '✅ Code follows guidelines!\n';
  } else {
    result += '⚠️  Issues found:\n';
    if (hasAntiPattern) {
      result += `- ${rule.advice}\n`;
    }
    if (!hasGoodPattern) {
      result += `- Missing recommended patterns for ${category}\n`;
    }
  }

  return {
    content: [{ type: 'text', text: result }],
  };
}
