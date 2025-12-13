# Enterprise Code Guardian — Manual Validation Checklist

Use this checklist to validate the VS Code chat agent behavior.

## Prereqs

- Open this repo in VS Code
- Install extensions:
  - GitHub Copilot
  - GitHub Copilot Chat
- Run the extension in Extension Development Host (F5)

## 1) Agent appears

- Open Copilot Chat
- Verify you can type:
  - `@guardian` (Enterprise Code Guardian)
  - `@guidelines` (Coding Guidelines)

## 2) Guideline search

Prompt:

- `@guardian search how should we name TypeScript types?`
  Expected:
- The agent searches and returns relevant guideline text.

## 3) Summary

Prompt:

- `@guardian summary testing guide`
  Expected:
- A concise summary of the relevant guideline doc/section.

## 4) Validate snippet

Prompt:

- `@guardian validate` + paste a small snippet with an obvious violation
  Expected:
- Violations + suggested correction.

## 5) Generate

Prompt:

- `@guardian create a navbar with logo, links, and a user menu`
  Expected:
- If missing target/framework info: agent asks 1–3 clarifying questions.
- If enough context: agent generates code and lists files + commands.

## 6) Restyle

Prompt:

- `@guardian make it more attractive`
  Expected:
- Agent asks what file/component and desired style direction.
