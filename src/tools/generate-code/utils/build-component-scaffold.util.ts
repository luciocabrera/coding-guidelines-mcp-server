import { SHARED_GUIDELINES_NOTES } from '../generate-code.const';
import type { GenerateCodeResult, GeneratedFile } from '../generate-code.types';

import { toPascalCase } from './to-pascal-case.util';

export function buildComponentScaffold(
  name: string,
  requirements?: string,
  includeTests: boolean = true,
  includeRef: boolean = false,
): GenerateCodeResult {
  const componentName = toPascalCase(name || 'Component');
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
    { content: componentFile, path: `src/components/${componentName}/${componentName}.tsx` },
    { content: typesFile, path: `src/components/${componentName}/${componentName}.types.ts` },
    { content: stylesFile, path: `src/components/${componentName}/${componentName}.styles.ts` },
    { content: indexFile, path: `src/components/${componentName}/index.ts` },
  ];

  if (includeTests) {
    files.push({
      content: testFile,
      path: `src/components/${componentName}/${componentName}.test.tsx`,
    });
  }

  const extra = requirements ? `\nRequirements: ${requirements}\n` : '';
  const postSteps = `\nAfter generation, run: npm run format && npm run lint && npm run typecheck && npm test -- --coverage`;

  return {
    commands: ['npm run format', 'npm run lint', 'npm run typecheck', 'npm test -- --coverage'],
    files,
    text: `${SHARED_GUIDELINES_NOTES}\n${extra}\nGenerated files (write these to disk):\n${files
      .map((f) => `- ${f.path}`)
      .join('\n')}${postSteps}`,
  };
}
