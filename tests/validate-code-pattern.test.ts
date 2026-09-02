import { describe, expect, it } from 'vitest';

import { handleValidateCodePattern } from '../src/tools/validate-code-pattern.tool.js';
import type { ValidationCategory } from '../src/types.js';
import { textOf } from './helpers.js';

const validate = (code: string, category: ValidationCategory) =>
  textOf(handleValidateCodePattern({ code, category }));

const PASSING = '✅ Code follows guidelines!';
const FAILING = '⚠️  Issues found:';

/** One conforming and one violating snippet for every category the tool ships with. */
const CASES: ReadonlyArray<{
  category: ValidationCategory;
  good: string;
  bad: string;
  adviceFragment: string;
}> = [
  {
    category: 'component',
    good: 'const Button = (props) => null;',
    bad: 'const Button: React.FC = function Button() { return null; };',
    adviceFragment: 'const arrow functions',
  },
  {
    category: 'styling',
    good: "const styles = stylex.create({ root: { color: 'red' } });",
    bad: 'const El = () => <div className="x" style={{ color: "red" }} />;',
    adviceFragment: 'StyleX',
  },
  {
    category: 'types',
    good: 'type Props = { readonly id: string };',
    bad: 'interface Props { id: string }',
    adviceFragment: "Prefer 'type' over 'interface'",
  },
  {
    category: 'testing',
    good: "describe('thing', () => { it('works', () => { expect(1).toBe(1); }); });",
    bad: "describe('thing', () => { it.only('works', () => { expect(1).toBe(1); }); });",
    adviceFragment: '.only()',
  },
  {
    category: 'file-structure',
    good: 'src/features/cart/Cart.tsx',
    bad: 'src/features/cart/cart.js',
    adviceFragment: 'TypeScript files',
  },
];

describe('validate_code_pattern', () => {
  describe.each(CASES)('$category', ({ category, good, bad, adviceFragment }) => {
    it('accepts a conforming snippet', () => {
      const result = validate(good, category);

      expect(result).toContain(`**Validation for ${category}:**`);
      expect(result).toContain(PASSING);
    });

    it('rejects a violating snippet and explains why', () => {
      const result = validate(bad, category);

      expect(result).toContain(FAILING);
      expect(result).toContain(adviceFragment);
    });
  });

  it('flags code that matches nothing as missing the recommended patterns', () => {
    const result = validate('# just a comment', 'component');

    expect(result).toContain(FAILING);
    expect(result).toContain('Missing recommended patterns for component');
  });

  it('rejects an unknown category and lists the valid ones', () => {
    const result = validate('const a = 1;', 'not-a-category' as ValidationCategory);

    expect(result).toContain('Unknown category: not-a-category');
    expect(result).toContain('component');
    expect(result).toContain('file-structure');
  });
});
