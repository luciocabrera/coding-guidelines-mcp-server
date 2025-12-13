# Custom ESLint Rules

This directory contains custom ESLint rules for this project.

## Rules

### `no-inline-type-imports`

Enforces the use of separate `import type` syntax instead of inline `type` keyword in import statements. Also detects and fixes redundant `type` keywords when used with `import type`.

#### ❌ Incorrect

```typescript
// Inline type imports
import { type Foo, type Bar } from './module';
import { type Baz } from './other';

// Redundant type keywords (caught by IDE and ESLint)
import type { Foo, type Bar } from './module';
```

#### ✅ Correct

```typescript
import type { Foo, Bar } from './module';
import type { Baz } from './other';
```

#### Why?

- **Consistency**: Having a single, consistent way to import types makes the codebase easier to read and maintain
- **Clarity**: The `import type` syntax makes it immediately clear at a glance that the entire import is type-only
- **Tooling**: Some tools and bundlers handle `import type` more efficiently

#### Auto-fix

This rule is auto-fixable. Running `npx eslint . --fix` will automatically convert inline type imports to separate type imports.

#### Configuration

The rule is configured in `eslint.config.mjs`:

```javascript
'local-rules/no-inline-type-imports': 'error',
```

### `merge-duplicate-imports`

Merges multiple import statements from the same source into a single import statement.

#### ❌ Incorrect

```typescript
import { getGuidelineSummary } from './get-guideline-summary';
import { GET_GUIDELINE_SUMMARY_TOOL } from './get-guideline-summary';
```

#### ✅ Correct

```typescript
import { GET_GUIDELINE_SUMMARY_TOOL, getGuidelineSummary } from './get-guideline-summary';
```

#### Why?

- **Clarity**: Single import statements per module are easier to scan and understand
- **Maintainability**: Reduces the number of import lines and makes reorganization easier
- **Consistency**: Enforces a single pattern across the codebase

#### Auto-fix

This rule is auto-fixable. Running `npx eslint . --fix` will automatically merge duplicate imports from the same source.

#### Configuration

The rule is configured in `eslint.config.mjs`:

```javascript
'local-rules/merge-duplicate-imports': 'error',
```

## Adding New Custom Rules

1. Create a new file in this directory: `your-rule-name.js`
2. Export the rule following ESLint's rule structure
3. Add the rule to `index.js` in the `rules` object
4. Configure the rule in `eslint.config.mjs`
