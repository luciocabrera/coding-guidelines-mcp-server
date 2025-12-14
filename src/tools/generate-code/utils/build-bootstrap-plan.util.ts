import type { GenerateCodeResult, GeneratedFile } from '../generate-code.types';

import { SHARED_GUIDELINES_NOTES } from '../generate-code.const';

export const buildBootstrapPlan = (requirements?: string): GenerateCodeResult => {
  const steps = `Bootstrap plan (React 19 + Vite + TypeScript + StyleX + ESLint + Prettier + Husky + Testing):
1) npm create vite@latest . -- --template react-ts
2) npm install @stylexjs/stylex @stylexjs/babel-plugin @stylexjs/eslint-plugin zod react-router-dom @types/react-router-dom --legacy-peer-deps
3) npm install -D eslint prettier husky lint-staged typescript @types/node vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @types/jsdom --legacy-peer-deps
4) Configure Vite + React (Babel StyleX plugin) and Vitest (jsdom, setupFiles) in vitest.config.ts
5) Add strict tsconfig and eslint/prettier configs
6) npx npm-check-updates -u && npm install --legacy-peer-deps
`;

  const extra = requirements ? `\nRequirements: ${requirements}\n` : '';

  const files: GeneratedFile[] = [
    {
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
`,
      path: 'tsconfig.json',
    },
    {
      content: `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "package.json"]
}
`,
      path: 'tsconfig.node.json',
    },
    {
      content: `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vitest.config.ts", "package.json"]
}
`,
      path: 'tsconfig.vitest.json',
    },
    {
      content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ babel: { plugins: ["@stylexjs/babel-plugin"] } })],
});
`,
      path: 'vite.config.ts',
    },
    {
      content: `import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ babel: { plugins: ["@stylexjs/babel-plugin"] } })],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    coverage: {
      provider: "v8",
    },
  },
});
`,
      path: 'vitest.config.ts',
    },
    {
      content: `import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import stylex from "@stylexjs/eslint-plugin";
import prettier from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  react.configs.recommended,
  react.configs["jsx-runtime"],
  reactHooks.configs.recommended,
  prettier,
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["dist", "build", "node_modules"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      stylex,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "prettier/prettier": "error",
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "stylex/no-inline-styles": "error",
      "stylex/sort-shorthand-properties": "warn",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "react/no-unstable-nested-components": "warn",
      "react/jsx-no-useless-fragment": "warn",
      "no-console": ["warn", { allow: ["error"] }],
    },
  }
);
`,
      path: 'eslint.config.js',
    },
    {
      content: `{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "semi": true
}
`,
      path: '.prettierrc.json',
    },
    {
      content: `node_modules
.DS_Store
dist
build
coverage
*.log
.idea
.vscode
`,
      path: '.gitignore',
    },
    {
      content: `#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  husky_skip_init=1
  export husky_skip_init
  . "$(dirname "$0")/husky.sh"
fi
`,
      path: '.husky/_/husky.sh',
    },
    {
      content: `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint && npm run typecheck && npm run format
`,
      path: '.husky/pre-commit',
    },
    {
      content: `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run build && npm test -- --coverage
`,
      path: '.husky/pre-push',
    },
    {
      content: `import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
      path: 'src/main.tsx',
    },
    {
      content: `export type Todo = { readonly id: string; readonly title: string; readonly done: boolean };
export type TodoInputProps = { readonly onAdd: (title: string) => void; readonly disabled?: boolean };
export type TodoItemProps = { readonly todo: Todo; readonly onToggle: (id: string) => void; readonly onRemove: (id: string) => void };
`,
      path: 'src/App.types.ts',
    },
    {
      content: `import "@testing-library/jest-dom";
`,
      path: 'src/setupTests.ts',
    },
    {
      content: `import * as stylex from "@stylexjs/stylex";

export const styles = stylex.create({
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    color: "#e2e8f0",
    padding: 24,
  },
  card: {
    width: "min(640px, 100%)",
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#1f2937",
    padding: 24,
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
  },
  form: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#1f2937",
    backgroundColor: "#0b1220",
    color: "#e2e8f0",
  },
  button: {
    padding: "10px 14px",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#1f2937",
    backgroundColor: "#22c55e",
    color: "#041016",
    fontWeight: 600,
    cursor: "pointer",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#1f2937",
    backgroundColor: "#0b1220",
  },
  checkbox: {
    width: 18,
    height: 18,
  },
  todoText: {
    flex: 1,
  },
  remove: {
    padding: "6px 10px",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#1f2937",
    backgroundColor: "#ef4444",
    color: "#0f172a",
    cursor: "pointer",
  },
});
`,
      path: 'src/App.styles.ts',
    },
    {
      content: `import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import type { TodoInputProps } from "../App.types";
import { styles } from "../App.styles";

export const TodoInput = ({ onAdd, disabled = false }: TodoInputProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue("");
  };

  return (
    <form {...stylex.props(styles.form)} onSubmit={handleSubmit}>
      <input
        {...stylex.props(styles.input)}
        name="title"
        placeholder="Add a todo"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        data-testid="todo-input"
      />
      <button type="submit" {...stylex.props(styles.button)} disabled={disabled} data-testid="add-todo">
        Add
      </button>
    </form>
  );
};
`,
      path: 'src/components/TodoInput.tsx',
    },
    {
      content: `import * as stylex from "@stylexjs/stylex";
import type { TodoItemProps } from "../App.types";
import { styles } from "../App.styles";

export const TodoItem = ({ todo, onToggle, onRemove }: TodoItemProps) => (
  <div {...stylex.props(styles.item)}>
    <input
      {...stylex.props(styles.checkbox)}
      type="checkbox"
      checked={todo.done}
      onChange={() => onToggle(todo.id)}
      data-testid={"todo-toggle-" + todo.title}
    />
    <span {...stylex.props(styles.todoText)}>{todo.title}</span>
    <button {...stylex.props(styles.remove)} onClick={() => onRemove(todo.id)} data-testid={"todo-remove-" + todo.title}>
      Remove
    </button>
  </div>
);
`,
      path: 'src/components/TodoItem.tsx',
    },
    {
      content: `import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import type { Todo } from "./App.types";
import { styles } from "./App.styles";
import { TodoInput } from "./components/TodoInput";
import { TodoItem } from "./components/TodoItem";

export const App = () => {
  const [todos, setTodos] = useState<ReadonlyArray<Todo>>([]);

  const handleAdd = (title: string) => {
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), title, done: false }]);
  };

  const handleToggle = (id: string) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  };

  const handleRemove = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const total = todos.length;
  const done = todos.filter((t) => t.done).length;

  return (
    <div {...stylex.props(styles.page)}>
      <main {...stylex.props(styles.card)}>
        <header {...stylex.props(styles.header)}>
          <h1 {...stylex.props(styles.title)}>Todo App</h1>
          <span>
            {done} / {total} done
          </span>
        </header>

        <TodoInput onAdd={handleAdd} />

        <section {...stylex.props(styles.list)}>
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onRemove={handleRemove} />
          ))}
        </section>
      </main>
    </div>
  );
};
`,
      path: 'src/App.tsx',
    },
    {
      content: `import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("allows adding a todo", () => {
    render(<App />);
    fireEvent.change(screen.getByTestId("todo-input"), { target: { value: "buy milk" } });
    fireEvent.click(screen.getByTestId("add-todo"));
    expect(screen.getByText("buy milk")).toBeInTheDocument();
  });

  it("allows toggling a todo", () => {
    render(<App />);
    fireEvent.change(screen.getByTestId("todo-input"), { target: { value: "wash car" } });
    fireEvent.click(screen.getByTestId("add-todo"));
    const toggle = screen.getByTestId("todo-toggle-wash car");
    fireEvent.click(toggle);
    expect((toggle as HTMLInputElement).checked).toBe(true);
  });

  it("allows removing a todo", () => {
    render(<App />);
    fireEvent.change(screen.getByTestId("todo-input"), { target: { value: "do taxes" } });
    fireEvent.click(screen.getByTestId("add-todo"));
    const remove = screen.getByTestId("todo-remove-do taxes");
    fireEvent.click(remove);
    expect(screen.queryByText("do taxes")).toBeNull();
  });
});
`,
      path: 'src/App.test.tsx',
    },
  ];

  return {
    commands: [
      'npm create vite@latest . -- --template react-ts',
      'npm install @stylexjs/stylex @stylexjs/babel-plugin @stylexjs/eslint-plugin zod react-router-dom @types/react-router-dom --legacy-peer-deps',
      'npm install -D eslint prettier husky lint-staged typescript @types/node vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @types/jsdom --legacy-peer-deps',
      'npx npm-check-updates -u',
      'npm install --legacy-peer-deps',
      'npx husky install .husky',
      'npm run format',
      'npm run lint',
      'npm run typecheck',
      'npm test -- --coverage',
    ],
    files,
    text: `${SHARED_GUIDELINES_NOTES}\n${extra}\n${steps}`,
  };
};
