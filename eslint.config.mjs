import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },

    rules: {
      // --- CONFLICT RESOLUTION (Crucial for Simple Import Sort) ---
      'sort-imports': 'off',
      'import/order': 'off',
      // -----------------------------------------------------------

      // --- TYPE IMPORT ENFORCEMENT ---
      // Enforce using 'import type' for type-only imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: true,
        },
      ],

      '@typescript-eslint/consistent-type-exports': [
        'error',
        {
          // Use the expected property name from the error message
          fixMixedExportsWithInlineTypeSpecifier: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'no-console': ['warn', { allow: ['error'] }],
      // --- IMPORT SORTING CONFIGURATION ---
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // 1. Side effect imports (e.g., import 'reflect-metadata';)
            ['^\\u0000'],
            // 2. Node.js built-ins (e.g., import fs from 'node:fs';)
            ['^node:', '^@?\\w'],
            // 3. External packages (e.g., import { z } from 'zod';)
            // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
            // But not `^@/` (which is often internal alias).
            ['^@?\\w'],
            // 4. Internal packages/Aliases (e.g. import { Tool } from '@/types')
            // Adjust this regex if you use a specific alias prefix like ~ or @/
            ['^@/'],
            // 5. Parent imports. Put `..` last.
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // 6. Other relative imports. Put same-folder imports and `.` last.
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // 7. Style imports.
            ['^.+\\.s?css$'],
          ],
        },
      ],
    },
  },

  {
    ignores: [
      'build/',
      'out/',
      'node_modules/',
      '*.js',
      '*.mjs',
      'guidelines/playwright_config.ts',
      'scripts/',
    ],
  },
);
