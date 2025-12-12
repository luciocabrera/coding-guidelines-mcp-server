/**
 * Validate Code Pattern Tool
 * Validates code snippets against established coding guidelines
 */

import type { ValidateCodePatternArgs } from "../types.js";
import { VALIDATION_RULES } from "../config/validation-rules.js";

export const validateCodePatternTool = {
  name: "validate_code_pattern",
  description: "Check if a code pattern follows the established guidelines",
  inputSchema: {
    type: "object" as const,
    properties: {
      code: {
        type: "string",
        description: "Code snippet to validate",
      },
      category: {
        type: "string",
        description: "Category to validate against",
        enum: ["component", "styling", "types", "testing", "file-structure"] as const,
      },
    },
    required: ["code", "category"],
  },
};

export function handleValidateCodePattern(args: ValidateCodePatternArgs) {
  const { code, category } = args;

  const rules = VALIDATION_RULES[category];
  if (!rules) {
    return {
      content: [
        {
          type: "text",
          text: `Unknown category: ${category}. Valid categories: ${Object.keys(VALIDATION_RULES).join(", ")}`,
        },
      ],
    };
  }

  const hasGoodPattern = rules.patterns.some((p) => p.test(code));
  const hasAntiPattern = rules.antiPatterns.some((p) => p.test(code));

  let result = `**Validation for ${category}:**\n\n`;
  if (hasGoodPattern && !hasAntiPattern) {
    result += "✅ Code follows guidelines!\n";
  } else {
    result += "⚠️  Issues found:\n";
    if (hasAntiPattern) {
      result += `- ${rules.advice}\n`;
    }
    if (!hasGoodPattern) {
      result += `- Missing recommended patterns for ${category}\n`;
    }
  }

  return {
    content: [{ type: "text", text: result }],
  };
}
