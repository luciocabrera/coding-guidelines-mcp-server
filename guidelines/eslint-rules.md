# ESLint Rules Quick Reference

This server exposes this document as an MCP resource at:

- `guidelines://eslint-rules`

## Where the real rules live

- See `eslint.config.mjs` in the repo root for the authoritative ESLint flat config.

## High-signal rules (summary)

- Formatting: Prettier is enforced via `eslint-plugin-prettier`.
- StyleX: inline styles are disallowed (`stylex/no-inline-styles`).
- TypeScript: prefer `type` imports and avoid unsafe patterns.
- React: follow React + hooks best practices.

If in doubt, run the linter in the target project and follow the reported fixes.
