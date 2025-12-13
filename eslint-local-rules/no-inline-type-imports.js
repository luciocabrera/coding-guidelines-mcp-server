/**
 * Custom ESLint rule to enforce separate type imports
 * Disallows: import { type X } from 'module'
 * Enforces: import type { X } from 'module'
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce separate type imports instead of inline type imports',
      category: 'Stylistic Issues',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
    messages: {
      noInlineTypeImport:
        'Use separate type import syntax: "import type { {{names}} }" instead of inline "type" keyword',
      redundantInlineType:
        'Redundant inline "type" keyword in import type statement. Remove "type" from: {{names}}',
    },
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        // Case 1: Check if this is already an "import type" statement with redundant inline "type" keywords
        if (node.importKind === 'type') {
          const hasRedundantInlineTypes = node.specifiers.some(
            (specifier) => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type',
          );

          if (hasRedundantInlineTypes) {
            const redundantNames = node.specifiers
              .filter((specifier) => specifier.importKind === 'type')
              .map((specifier) => specifier.imported.name)
              .join(', ');

            context.report({
              node,
              messageId: 'redundantInlineType',
              data: { names: redundantNames },
              fix(fixer) {
                const sourceCode = context.getSourceCode();

                // Build the fixed import by removing inline 'type' keywords
                const importedNames = node.specifiers
                  .map((specifier) => {
                    if (specifier.imported.name === specifier.local.name) {
                      return specifier.imported.name;
                    } else {
                      return `${specifier.imported.name} as ${specifier.local.name}`;
                    }
                  })
                  .join(', ');

                const fromClause = sourceCode.getText(node.source);
                const newImport = `import type { ${importedNames} } from ${fromClause}`;

                return fixer.replaceText(node, newImport);
              },
            });
          }
          return;
        }

        // Case 2: Check if this is a regular import with inline type specifiers
        const hasInlineTypes = node.specifiers.some(
          (specifier) => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type',
        );

        if (!hasInlineTypes) {
          return;
        }

        // Check if ALL imports are types (not mixed)
        const allTypes = node.specifiers.every(
          (specifier) => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type',
        );

        if (!allTypes) {
          // Mixed imports - let TypeScript-ESLint handle this
          return;
        }

        // Get the imported names
        const names = node.specifiers.map((specifier) => specifier.imported.name).join(', ');

        context.report({
          node,
          messageId: 'noInlineTypeImport',
          data: { names },
          fix(fixer) {
            const sourceCode = context.getSourceCode();
            const importKeyword = sourceCode.getFirstToken(node);
            const openBrace = sourceCode.getTokenAfter(importKeyword);

            // Build the new import statement
            const importedNames = node.specifiers
              .map((specifier) => {
                if (specifier.imported.name === specifier.local.name) {
                  return specifier.imported.name;
                } else {
                  return `${specifier.imported.name} as ${specifier.local.name}`;
                }
              })
              .join(', ');

            const fromClause = sourceCode.getText(node.source);
            const newImport = `import type { ${importedNames} } from ${fromClause}`;

            return fixer.replaceText(node, newImport);
          },
        });
      },
    };
  },
};
