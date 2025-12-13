export const SHARED_GUIDELINES_NOTES = `Pre-flight checklist (workspace):
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

export const GENERATE_CODE_TOOL = {
  name: 'generate_code',
  description:
    'Generate guideline-compliant scaffolds for components, features, or project bootstrap',
  inputSchema: {
    type: 'object' as const,
    properties: {
      task: {
        type: 'string',
        enum: ['component', 'feature', 'bootstrap', 'hook'],
        description: 'What to generate',
      },
      name: {
        type: 'string',
        description: 'Name of the component/feature/hook',
      },
      requirements: {
        type: 'string',
        description: 'Optional requirements or notes to incorporate',
      },
      includeTests: {
        type: 'boolean',
        description: 'Include a minimal test file when applicable',
      },
    },
    required: ['task', 'name'],
  },
};
