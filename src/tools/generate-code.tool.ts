import type { GenerateCodeArgs, GenerateCodeResult, GeneratedFile } from "../types.js";

const sharedGuidelineNotes = `Pre-flight checklist (workspace):
- Verify you are in the coding-guidelines workspace and dependencies are installed (React 19, StyleX, babel/vite plugins, testing stack). See setup guide in /guidelines.
- Ensure tsconfig strict flags and eslint/prettier configs are applied.

Guidelines applied:
- React 19 + React Compiler (no memo/useCallback wrappers needed); follow React 19 improvements (see react.dev/blog/2024/12/05/react-19#improvements-in-react-19).
- React Compiler install guidance: react.dev/learn/react-compiler/installation (ensure babel plugin/vite config aligns).
- TypeScript, StyleX; no inline styles. Strict typing with readonly props; prefer type aliases; clean code with clear separation of concerns and SOLID mindset.
- Performance: avoid unnecessary re-renders, keep state localized, prefer derived values over extra state, and keep renders cheap.
- UX/a11y: use semantic elements, aria-label/aria-live where helpful, focus management for forms/actions, and ensure readable contrast.
- Visuals: aim for attractive, purposeful styling (not default grays), consistent spacing/typography, and clear affordances.
- File suffixes: *.tsx, *.styles.ts, *.types.ts, index.ts, *.test.tsx.
- Co-locate component bundle under its feature directory.
- After generation: run formatter, linter, type-check, and tests (aim for >=95% coverage).
`;

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^\d+/, "");
}

function buildComponentScaffold(
  name: string,
  requirements?: string,
  includeTests: boolean = true,
  includeRef: boolean = false
): GenerateCodeResult {
  const componentName = toPascalCase(name || "Component");
  const propsName = `${componentName}Props`;

  const componentFile = includeRef
    ? `import * as stylex from "@stylexjs/stylex";
import type { ${propsName} } from "./${componentName}.types";
import { styles } from "./${componentName}.styles";

export const ${componentName} = ({
  disabled = false,
  icon,
  label,
  onPress,
  ref,
  variant = "primary",
}: ${propsName}) => {
  const handlePress = () => {
    if (disabled) return;
    onPress();
  };

  return (
    <button
      aria-disabled={disabled}
      data-testid="${componentName}-button"
      onClick={handlePress}
      ref={ref}
      type="button"
      {...stylex.props(styles.base, styles[variant], disabled && styles.disabled)}
    >
      {icon ? <span {...stylex.props(styles.icon)}>{icon}</span> : null}
      <span {...stylex.props(styles.label)}>{label}</span>
    </button>
  );
};
`
    : `import * as stylex from "@stylexjs/stylex";
import type { ${propsName} } from "./${componentName}.types";
import { styles } from "./${componentName}.styles";

export const ${componentName} = ({ disabled = false, icon, label, onPress, variant = "primary" }: ${propsName}) => {
  const handlePress = () => {
    if (disabled) return;
    onPress();
  };

  return (
    <button
      aria-disabled={disabled}
      data-testid="${componentName}-button"
      onClick={handlePress}
      type="button"
      {...stylex.props(styles.base, styles[variant], disabled && styles.disabled)}
    >
      {icon ? <span {...stylex.props(styles.icon)}>{icon}</span> : null}
      <span {...stylex.props(styles.label)}>{label}</span>
    </button>
  );
};
`;

  const typesFile = includeRef
    ? `import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";

export type ${propsName} = ComponentPropsWithoutRef<"button"> & {
  readonly label: string;
  readonly icon?: ReactNode;
  readonly onPress: () => void;
  readonly variant?: "primary" | "secondary";
  readonly disabled?: boolean;
  readonly ref?: Ref<HTMLButtonElement>;
};
`
    : `import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ${propsName} = ComponentPropsWithoutRef<"button"> & {
  readonly label: string;
  readonly icon?: ReactNode;
  readonly onPress: () => void;
  readonly variant?: "primary" | "secondary";
  readonly disabled?: boolean;
};
`;

  const stylesFile = `import * as stylex from "@stylexjs/stylex";

export const styles = stylex.create({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    paddingInline: 12,
    paddingBlock: 8,
    borderRadius: 8,
    backgroundColor: "var(--surface-strong)",
    color: "var(--text-contrast)",
    border: "1px solid var(--border-strong)",
    cursor: "pointer",
    transitionProperty: "transform, box-shadow, background-color",
    transitionDuration: "120ms",
  },
  primary: {
    backgroundColor: "var(--surface-strong)",
    color: "var(--text-contrast)",
    border: "1px solid var(--border-strong)",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "var(--text-strong)",
    border: "1px solid var(--border-subtle)",
  },
  label: {
    fontWeight: 600,
  },
  icon: {
    display: "inline-flex",
  },
  disabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
});
`;

  const indexFile = `export { ${componentName} } from "./${componentName}";
export type { ${propsName} } from "./${componentName}.types";
`;

  const testFile = `import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ${componentName} } from "./${componentName}";

describe("${componentName}", () => {
  it("calls onPress when clicked", () => {
    const onPress = vi.fn();
    render(<${componentName} label="Save" onPress={onPress} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = vi.fn();
    render(<${componentName} label="Save" onPress={onPress} disabled />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders icon and data-testid for testing", () => {
    const onPress = vi.fn();
    render(
      <${componentName}
        label="Save"
        icon={<span role="img" aria-label="icon">*</span>}
        onPress={onPress}
      />
    );

    expect(screen.getByTestId("${componentName}-button")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByLabelText("icon")).toBeInTheDocument();
  });

  it("applies secondary variant", () => {
    const onPress = vi.fn();
    render(<${componentName} label="Alt" onPress={onPress} variant="secondary" />);
    expect(screen.getByRole("button", { name: "Alt" })).toBeInTheDocument();
  });

  it("accepts ref prop", () => {
    const onPress = vi.fn();
    const ref = { current: null as HTMLButtonElement | null };
    render(<${componentName} label="Ref" onPress={onPress} ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
`;

  const files: GeneratedFile[] = [
    { path: `src/components/${componentName}/${componentName}.tsx`, content: componentFile },
    { path: `src/components/${componentName}/${componentName}.types.ts`, content: typesFile },
    { path: `src/components/${componentName}/${componentName}.styles.ts`, content: stylesFile },
    { path: `src/components/${componentName}/index.ts`, content: indexFile },
  ];

  if (includeTests) {
    files.push({
      path: `src/components/${componentName}/${componentName}.test.tsx`,
      content: testFile,
    });
  }

  const extra = requirements ? `\nRequirements: ${requirements}\n` : "";
  const postSteps = `\nAfter generation, run: npm run format && npm run lint && npm run typecheck && npm test -- --coverage`;

  return {
    text: `${sharedGuidelineNotes}\n${extra}\nGenerated files (write these to disk):\n${files
      .map((f) => `- ${f.path}`)
      .join("\n")}${postSteps}`,
    files,
    commands: ["npm run format", "npm run lint", "npm run typecheck", "npm test -- --coverage"],
  };
}

function buildFeatureScaffold(name: string, requirements?: string): GenerateCodeResult {
  const featureName = toPascalCase(name || "Feature");
  const componentName = `${featureName}Card`;
  const base = `Feature bundle: ${featureName}

Structure:
- src/features/${featureName}/components/${componentName}/${componentName}.tsx
- src/features/${featureName}/components/${componentName}/${componentName}.styles.ts
- src/features/${featureName}/components/${componentName}/${componentName}.types.ts
- src/features/${featureName}/components/${componentName}/index.ts
- src/features/${featureName}/hooks/use${featureName}.hook.ts
- src/features/${featureName}/services/${featureName}Api.service.ts
- src/features/${featureName}/index.ts (barrel)
`;

  const componentSnippet = buildComponentScaffold(componentName, undefined, false, false);
  const hookSnippet = `### use${featureName}.hook.ts\n\n\`\`\`ts\nimport { useEffect, useState } from "react";

type Use${featureName}State = { readonly loading: boolean; readonly data: string | null; };

type Use${featureName}Result = Use${featureName}State & { readonly refresh: () => Promise<void>; };

export const use${featureName} = (): Use${featureName}Result => {
  const [state, setState] = useState<Use${featureName}State>({ loading: false, data: null });

  const refresh = async () => {
    setState({ loading: true, data: null });
    // TODO: call service
    setState({ loading: false, data: "example" });
  };

  useEffect(() => {
    refresh().catch(() => setState({ loading: false, data: null }));
  }, []);

  return { ...state, refresh };
};
\`\`\``;

  const serviceSnippet = `### ${featureName}Api.service.ts\n\n\`\`\`ts\nimport { z } from "zod";

const ExampleSchema = z.object({ message: z.string() });

export const fetch${featureName} = async () => {
  const response = await fetch("/api/example");
  const json = await response.json();
  const parsed = ExampleSchema.parse(json);
  return parsed;
};
\`\`\``;

  const extras = requirements ? `\nRequirements: ${requirements}\n` : "";
  return {
    text: `${sharedGuidelineNotes}\n${extras}\n${base}\n${componentSnippet}\n\n${hookSnippet}\n\n${serviceSnippet}`,
    files: undefined,
    commands: ["npm run format", "npm run lint", "npm run typecheck", "npm test -- --coverage"],
  };
}

function buildBootstrapPlan(requirements?: string): GenerateCodeResult {
  const steps = `Bootstrap plan (React 19 + Vite + TypeScript + StyleX + ESLint + Prettier + Husky + Testing):
1) npm create vite@latest . -- --template react-ts
2) npm install @stylexjs/stylex @stylexjs/babel-plugin @stylexjs/eslint-plugin zod react-router-dom @types/react-router-dom --legacy-peer-deps
3) npm install -D eslint prettier husky lint-staged typescript @types/node vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @types/jsdom --legacy-peer-deps
4) Configure Vite + React (Babel StyleX plugin) and Vitest (jsdom, setupFiles) in vitest.config.ts
5) Add strict tsconfig and eslint/prettier configs
6) npx npm-check-updates -u && npm install --legacy-peer-deps
`;

  const extra = requirements ? `\nRequirements: ${requirements}\n` : "";

  const files: GeneratedFile[] = [
    {
      path: "tsconfig.json",
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
`
    },
    {
      path: "tsconfig.node.json",
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
`
    },
    {
      path: "tsconfig.vitest.json",
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
`
    },
    {
      path: "vite.config.ts",
      content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ babel: { plugins: ["@stylexjs/babel-plugin"] } })],
});
`
    },
    {
      path: "vitest.config.ts",
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
`
    },
    {
      path: "eslint.config.js",
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
`
    },
    {
      path: ".prettierrc.json",
      content: `{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "semi": true
}
`
    },
    {
      path: ".gitignore",
      content: `node_modules
.DS_Store
dist
build
coverage
*.log
.idea
.vscode
`
    },
    {
      path: ".husky/_/husky.sh",
      content: `#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  husky_skip_init=1
  export husky_skip_init
  . "$(dirname "$0")/husky.sh"
fi
`
    },
    {
      path: ".husky/pre-commit",
      content: `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint && npm run typecheck && npm run format
`
    },
    {
      path: ".husky/pre-push",
      content: `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run build && npm test -- --coverage
`
    },
    {
      path: "src/main.tsx",
      content: `import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
    },
    {
      path: "src/App.types.ts",
      content: `export type Todo = { readonly id: string; readonly title: string; readonly done: boolean };
export type TodoInputProps = { readonly onAdd: (title: string) => void; readonly disabled?: boolean };
export type TodoItemProps = { readonly todo: Todo; readonly onToggle: (id: string) => void; readonly onRemove: (id: string) => void };
`
    },
    {
      path: "src/setupTests.ts",
      content: `import "@testing-library/jest-dom";
`
    },
    {
      path: "src/App.styles.ts",
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
`
    },
    {
      path: "src/components/TodoInput.tsx",
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
`
    },
    {
      path: "src/components/TodoItem.tsx",
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
`
    },
    {
      path: "src/App.tsx",
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
`
    },
    {
      path: "src/App.test.tsx",
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
`
    },
  ];

  return {
    text: `${sharedGuidelineNotes}\n${extra}\n${steps}`,
    files,
    commands: [
      "npm create vite@latest . -- --template react-ts",
      "npm install @stylexjs/stylex @stylexjs/babel-plugin @stylexjs/eslint-plugin zod react-router-dom @types/react-router-dom --legacy-peer-deps",
      "npm install -D eslint prettier husky lint-staged typescript @types/node vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @types/jsdom --legacy-peer-deps",
      "npx npm-check-updates -u",
      "npm install --legacy-peer-deps",
      "npx husky install .husky",
      "npm run format",
      "npm run lint",
      "npm run typecheck",
      "npm test -- --coverage"
    ],
  };
}

export const generateCodeTool = {
  name: "generate_code",
  description: "Generate guideline-compliant scaffolds for components, features, or project bootstrap",
  inputSchema: {
    type: "object" as const,
    properties: {
      task: {
        type: "string",
        enum: ["component", "feature", "bootstrap", "hook"],
        description: "What to generate",
      },
      name: {
        type: "string",
        description: "Name of the component/feature/hook",
      },
      requirements: {
        type: "string",
        description: "Optional requirements or notes to incorporate",
      },
      includeTests: {
        type: "boolean",
        description: "Include a minimal test file when applicable",
      },
    },
    required: ["task", "name"],
  },
};

export function handleGenerateCode(args: GenerateCodeArgs) {
  const { task, name, requirements, includeTests } = args;

  switch (task) {
    case "component":
      return buildComponentScaffold(name, requirements, includeTests);
    case "feature":
      return buildFeatureScaffold(name, requirements);
    case "bootstrap":
      return buildBootstrapPlan(requirements);
    case "hook":
      return buildFeatureScaffold(`${name}Hook`, requirements);
    default:
      return { content: [{ type: "text", text: "Unknown task" }] };
  }
}
