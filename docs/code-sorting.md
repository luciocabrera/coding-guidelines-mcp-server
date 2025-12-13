# Code Sorting with Perfectionist

This project uses `eslint-plugin-perfectionist` to automatically sort code elements alphabetically.

## What Gets Sorted

- **Object properties** - All object literals are sorted alphabetically
- **Type members** - TypeScript type and interface properties are sorted
- **Class members** - Class properties and methods are sorted

## Auto-Fix

All sorting rules are auto-fixable. Run:

```bash
npm run lint
```

This will automatically sort all objects, types, and classes in your code.

## Benefits

- ✅ Consistent code structure across the codebase
- ✅ Easier to find properties in large objects/types
- ✅ Reduces merge conflicts
- ✅ Follows enterprise coding standards

## Configuration

Sorting rules are configured in `eslint.config.mjs`:

- `perfectionist/sort-objects` - Sorts object properties
- `perfectionist/sort-interfaces` - Sorts interface members
- `perfectionist/sort-object-types` - Sorts type members
- `perfectionist/sort-classes` - Sorts class members

All use natural alphabetical sorting (case-insensitive).

## Examples

### Before

```typescript
export type User = {
  name: string;
  id: string;
  email: string;
  age: number;
};

const config = {
  timeout: 5000,
  apiUrl: 'https://api.example.com',
  version: '1.0.0',
};
```

### After (auto-fixed)

```typescript
export type User = {
  age: number;
  email: string;
  id: string;
  name: string;
};

const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  version: '1.0.0',
};
```
