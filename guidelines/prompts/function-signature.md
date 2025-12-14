Task: Refactor Function Signatures to Enforce "Single Object Parameter" Pattern

1. Run Analysis First, run the project linter to identify all files currently violating the rule: local-rules/destructuring-for-functions.

2. Fix Violations For every file where this warning occurs, refactor the code to strictly follow these requirements:

Single Parameter Only: Convert all functions that currently accept multiple arguments (e.g., fn(arg1, arg2)) to accept a single destructured object (e.g., fn({ arg1, arg2 })).

Named Types (No Inline types): Do not use inline type definitions (e.g., fn(params: { id: string })). Instead, define a dedicated type for the parameters immediately before the function.

Naming Convention: Use the function name suffixed with Args (e.g., type ExtractContextArgs = { ... }).

Use type, not interface: Strictly use type definitions for these parameter objects.

Update Call Sites: Find usage of these functions within the file (and imports if visible) and update the calls to pass an object.

3. Verification Rerun the linter on the fixed files to ensure no warnings remain.

4. Verification Rerun the type checker to ensure no type errors were introduced.
