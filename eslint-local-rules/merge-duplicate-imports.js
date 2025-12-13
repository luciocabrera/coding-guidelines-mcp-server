/**
 * Custom ESLint rule to merge duplicate imports from the same source
 * Enforces: import { A, B } from './module'
 * Disallows: import { A } from './module'; import { B } from './module'
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Merge duplicate imports from the same source into a single import statement',
      category: 'Best Practices',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
    messages: {
      duplicateImport: 'Multiple imports from "{{source}}". Merge into a single import statement.',
    },
  },

  create(context) {
    const sourceMap = new Map();

    return {
      Program(node) {
        // Collect all import declarations
        const imports = node.body.filter((stmt) => stmt.type === 'ImportDeclaration');

        // Group by source
        imports.forEach((importNode) => {
          const source = importNode.source.value;
          if (!sourceMap.has(source)) {
            sourceMap.set(source, []);
          }
          sourceMap.get(source).push(importNode);
        });

        // Check for duplicates and report
        sourceMap.forEach((importNodes, source) => {
          if (importNodes.length > 1) {
            // Check if they're all the same kind (all value imports or all type imports)
            const allSameKind = importNodes.every(
              (node) => node.importKind === importNodes[0].importKind,
            );

            if (allSameKind) {
              // Report on all but the first import
              importNodes.slice(1).forEach((importNode) => {
                context.report({
                  node: importNode,
                  messageId: 'duplicateImport',
                  data: { source },
                  fix(fixer) {
                    const sourceCode = context.getSourceCode();
                    const fixes = [];

                    // Collect all specifiers from all imports of this source
                    const allSpecifiers = [];
                    const importKind = importNodes[0].importKind;

                    importNodes.forEach((node) => {
                      node.specifiers.forEach((specifier) => {
                        if (specifier.type === 'ImportSpecifier') {
                          if (specifier.imported.name === specifier.local.name) {
                            allSpecifiers.push(specifier.imported.name);
                          } else {
                            allSpecifiers.push(
                              `${specifier.imported.name} as ${specifier.local.name}`,
                            );
                          }
                        } else if (specifier.type === 'ImportDefaultSpecifier') {
                          allSpecifiers.push(`default as ${specifier.local.name}`);
                        } else if (specifier.type === 'ImportNamespaceSpecifier') {
                          allSpecifiers.push(`* as ${specifier.local.name}`);
                        }
                      });
                    });

                    // Remove duplicates
                    const uniqueSpecifiers = [...new Set(allSpecifiers)];

                    // Build the merged import
                    const importKeyword = importKind === 'type' ? 'import type' : 'import';
                    const fromClause = sourceCode.getText(importNodes[0].source);
                    const mergedImport = `${importKeyword} { ${uniqueSpecifiers.join(', ')} } from ${fromClause};`;

                    // Replace the first import with the merged version
                    fixes.push(fixer.replaceText(importNodes[0], mergedImport));

                    // Remove all other imports
                    for (let i = 1; i < importNodes.length; i++) {
                      fixes.push(fixer.remove(importNodes[i]));
                    }

                    return fixes;
                  },
                });
              });
            }
          }
        });
      },
    };
  },
};
