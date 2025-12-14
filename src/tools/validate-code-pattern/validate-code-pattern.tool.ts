/**
 * Validate Code Pattern Tool
 * Validates code snippets against established coding guidelines
 */

import type { ValidateCodePatternArgs } from './validate-code-pattern.types.js';

import { VALIDATION_RULES } from './validate-code-pattern.const.js';

export const validateCodePattern = (args: ValidateCodePatternArgs) => {
  const { category, code } = args;

  // Validate category exists before accessing (Standard 010: Safe Object Property Access)
  if (!Object.hasOwn(VALIDATION_RULES, category)) {
    return {
      content: [
        {
          text: `Unknown category: ${category}. Valid categories: ${Object.keys(VALIDATION_RULES).join(', ')}`,
          type: 'text',
        },
      ],
    };
  }

  // eslint-disable-next-line security/detect-object-injection -- category validated with Object.hasOwn above
  const rules = VALIDATION_RULES[category];

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
    content: [{ text: result, type: 'text' }],
  };
};
