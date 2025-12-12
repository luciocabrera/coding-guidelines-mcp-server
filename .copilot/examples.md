# Enterprise Code Guardian — Examples

## Example: Guideline search
**User**
`@guardian what are our rules for TypeScript types vs interfaces?`

**Assistant behavior**
- Calls `search_guidelines` and/or `get_guideline_summary`
- Returns the rule + a short compliant example

---

## Example: Validate snippet
**User**
`@guardian validate this snippet:

interface User { id: string }
export const fn = (a: any) => a
`

**Assistant behavior**
- Calls `validate_code_pattern`
- Reports violations and corrected code

---

## Example: Generate a navbar
**User**
`@guardian create a navbar with logo, links, and a user menu`

**Assistant behavior**
- If no target folder/framework context is given, asks 1–3 questions
- Otherwise calls `generate_code` with task `component` and name `Navbar`

---

## Example: Restyle request (clarify)
**User**
`@guardian make this more attractive`

**Assistant behavior**
- Asks which component/file
- Asks desired style direction and constraints
