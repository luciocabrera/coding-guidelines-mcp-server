/**
 * Validate Code Pattern Tool
 * Validates code snippets against established coding guidelines
 */

import { VALIDATION_RULES } from './validate-code-pattern.const.js';
import type { ValidateCodePatternArgs, ValidationRule } from './validate-code-pattern.types.js';

export function validateCodePattern(args: ValidateCodePatternArgs) {
  const { code, category } = args;

  const rules: ValidationRule | undefined = VALIDATION_RULES[category];
  if (!rules) {
    return {
      content: [
        {
          type: 'text',
          text: `Unknown category: ${category}. Valid categories: ${Object.keys(VALIDATION_RULES).join(', ')}`,
        },
      ],
    };
  }

  const hasGoodPattern = rules.patterns.some((p) => p.test(code));
  const hasAntiPattern = rules.antiPatterns.some((p) => p.test(code));

  let result = `**Validation for ${category}:**\n\n`;
  if (hasGoodPattern && !hasAntiPattern) {
    result += '✅ Code follows guidelines!\n';
  } else {
    result += '⚠️  Issues found:\n';
    if (hasAntiPattern) {
      result += `- ${rules.advice}\n`;
    }
    if (!hasGoodPattern) {
      result += `- Missing recommended patterns for ${category}\n`;
    }
  }

  return {
    content: [{ type: 'text', text: result }],
  };
}
