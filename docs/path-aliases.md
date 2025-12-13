# Path Aliases

This project uses the `@` alias to simplify imports.

## Configuration

The `@` alias is configured in:

- `tsconfig.json` - For TypeScript compiler
- `src/extension/tsconfig.json` - For VS Code extension build

## Usage

Instead of using relative imports:

```typescript
import type { Guideline } from '../../../types';
import { VALIDATION_RULES } from '../../config/validation-rules';
```

Use the `@` alias for cleaner imports:

```typescript
import type { Guideline } from '@/types';
import { VALIDATION_RULES } from '@/config/validation-rules';
```

## Benefits

- ✅ No more counting `../` levels
- ✅ Easier to refactor and move files
- ✅ More readable imports
- ✅ Consistent import paths across the codebase

## Note

The `@` alias points to the `src/` directory root, so:

- `@/types` → `src/types`
- `@/config/validation-rules` → `src/config/validation-rules`
- `@/tools/search-guidelines` → `src/tools/search-guidelines`
