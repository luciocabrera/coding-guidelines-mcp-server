# Complete Project Setup Guide

This document contains ALL configuration files needed to set up your enterprise-grade React project.

---

## 📁 Project Structure

```
your-project/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .husky/
│   ├── pre-commit
│   └── validate-naming.js
├── .vscode/
│   ├── settings.json
│   └── extensions.json
├── src/
│   └── test/
│       ├── setup.ts
│       └── test-utils.tsx
├── .eslintignore
├── .prettierignore
├── .prettierrc.js
├── eslint.config.js
├── package.json
├── performance-budget.config.js
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 🚀 Quick Setup Script

Save this as `setup.sh` and run `chmod +x setup.sh && ./setup.sh`:

```bash
#!/bin/bash

echo "🚀 Setting up enterprise React project..."

# Create directory structure
mkdir -p .github/workflows
mkdir -p .husky
mkdir -p .vscode
mkdir -p src/test
mkdir -p src/features
mkdir -p src/shared/{components,hooks,utils,types}

echo "✅ Directory structure created"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --save react react-dom react-router react-router-dom @stylexjs/stylex zod

npm install --save-dev \
  @eslint/js \
  @stylexjs/babel-plugin \
  @stylexjs/eslint-plugin \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @types/node \
  @types/react \
  @types/react-dom \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  @vitejs/plugin-react \
  @vitest/coverage-v8 \
  @vitest/ui \
  eslint \
  eslint-config-prettier \
  eslint-import-resolver-typescript \
  eslint-plugin-import \
  eslint-plugin-jsx-a11y \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  husky \
  jsdom \
  lint-staged \
  prettier \
  prettier-plugin-organize-imports \
  rollup-plugin-visualizer \
  typescript \
  vite \
  vite-plugin-stylex \
  vitest@^2.0.0

echo "✅ Dependencies installed"

# Initialize Husky
npx husky init
echo '#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."
npx lint-staged
npm run type-check
echo "✅ Pre-commit checks passed!"' > .husky/pre-commit

chmod +x .husky/pre-commit

echo "✅ Husky configured"

echo "🎉 Setup complete! Now copy the configuration files from the guide."
echo "📝 Next steps:"
echo "   1. Copy all config files listed in this guide"
echo "   2. Run: npm run validate"
echo "   3. Start developing!"
```

---

## 📄 Configuration Files

### 1. `package.json`

```json
{
  "name": "enterprise-react-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:analyze": "ANALYZE=true npm run build",
    "build:check": "npm run build && node performance-budget.config.js",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run --coverage --reporter=verbose --reporter=json --reporter=junit",
    "validate": "npm run type-check && npm run lint && npm run format:check && npm run test:coverage",
    "analyze": "npm run build:analyze",
    "prepare": "husky"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0",
    "react-router-dom": "^7.0.0",
    "@stylexjs/stylex": "^0.9.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.15.0",
    "@stylexjs/babel-plugin": "^0.9.0",
    "@stylexjs/eslint-plugin": "^0.9.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@typescript-eslint/eslint-plugin": "^8.15.0",
    "@typescript-eslint/parser": "^8.15.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@vitest/coverage-v8": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "eslint": "^9.15.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-import-resolver-typescript": "^3.6.3",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-jsx-a11y": "^6.10.0",
    "eslint-plugin-react": "^7.37.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "husky": "^9.1.0",
    "jsdom": "^25.0.0",
    "lint-staged": "^15.2.0",
    "prettier": "^3.3.0",
    "prettier-plugin-organize-imports": "^4.1.0",
    "rollup-plugin-visualizer": "^5.12.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vite-plugin-stylex": "^0.9.0",
    "vitest": "^2.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write", "vitest related --run"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

### 2. `.eslintignore`

```
node_modules
dist
build
coverage
public
*.min.js
*.min.css
.cache
```

---

### 3. `.prettierignore`

```
node_modules
dist
build
coverage
.cache
public
*.min.js
*.min.css
package-lock.json
pnpm-lock.yaml
yarn.lock
```

---

### 4. `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "files.associations": {
    "*.css": "css"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

### 5. `.vscode/extensions.json`

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "styled-components.vscode-styled-components"
  ]
}
```

---

### 6. `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run linting
        run: npm run lint

      - name: Run formatting check
        run: npm run format:check

      - name: Run tests with coverage
        run: npm run test:ci

      - name: Check bundle size
        run: npm run build:check

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests
```

---

## 📋 File References

All other configuration files have been created in previous artifacts:

1. **eslint.config.js** - See artifact: "ESLint Configuration"
2. **.prettierrc.js** - See artifact: "Prettier Configuration"
3. **tsconfig.json** - See artifact: "TypeScript Configuration"
4. **vite.config.ts** - See artifact: "Vite Configuration with StyleX"
5. **vitest.config.ts** - See artifact: "Vitest Configuration"
6. **.husky/validate-naming.js** - See artifact: "File Naming Convention Validator"
7. **performance-budget.config.js** - See artifact: "Performance Budget Configuration"
8. **src/test/setup.ts** - See artifact: "Test Setup File"
9. **src/test/test-utils.tsx** - See artifact: "Test Utilities & Helpers"

---

## ✅ Verification Steps

After copying all files:

```bash
# 1. Install dependencies
npm install

# 2. Initialize Husky
npx husky init

# 3. Run validation
npm run validate

# 4. Try a test build
npm run build

# 5. Analyze bundle
npm run analyze

# 6. Run tests with UI
npm run test:ui
```

---

## 🎯 What You Get

### ✅ Enforced Standards

- TypeScript strict mode
- ESLint with React 19 rules
- Prettier auto-formatting
- File naming validation
- 80% test coverage minimum

### ✅ Development Experience

- Hot module replacement
- Type-safe routing
- StyleX with zero runtime
- Path aliases (@/)
- VS Code integration

### ✅ Quality Assurance

- Pre-commit hooks
- Automated testing
- Bundle size analysis
- Performance budgets
- CI/CD pipeline

### ✅ Documentation

- Coding standards guide
- Testing best practices
- Setup instructions
- Troubleshooting guide

---

## 🆘 Troubleshooting

### Module not found errors

```bash
npm install
npm run type-check
```

### Husky hooks not running

```bash
rm -rf .husky
npx husky init
chmod +x .husky/pre-commit
```

### ESLint errors

```bash
npm run lint:fix
```

### Test failures

```bash
npm run test:ui
# Then debug visually
```

---

## 📚 Next Steps

1. **Review the Enterprise Coding Standards** document
2. **Set up your first feature** following the architecture guide
3. **Create your first component** with tests
4. **Run validation** before every commit
5. **Monitor bundle size** regularly

---

**Setup Version:** 1.0.0  
**Last Updated:** December 2025
