# Contributing Guide

## Open Contribution Policy

Anyone can contribute to this project.

- Fork the repository.
- Create a feature branch from `main`.
- Make focused changes.
- Open a pull request with clear context and screenshots for UI changes.

## Local Setup

```bash
npm install
cp .env.example .env
npm run start
```

## Branch Naming

Use descriptive branch names:

- `feat/<short-name>`
- `fix/<short-name>`
- `docs/<short-name>`
- `chore/<short-name>`

Examples:

- `feat/custom-category-filter`
- `fix/google-oauth-timeout`

## Commit Standard (Required)

Use Conventional Commits:

`<type>(<scope>): <short summary>`

Allowed types:

- `feat`
- `fix`
- `docs`
- `style`
- `refactor`
- `perf`
- `test`
- `build`
- `ci`
- `chore`
- `revert`

Rules:

- Summary must be imperative and lowercase.
- Keep commit subject concise.
- One logical change per commit.
- Use scope when possible (`auth`, `family`, `grocery`, `ui`, `docs`).
- For breaking changes, add `!` after type/scope.

Examples:

- `feat(grocery): support custom categories`
- `fix(family): handle invite code trim and uppercase`
- `docs(readme): document commit convention`

Enforced locally:

- A `husky` `commit-msg` hook runs `commitlint` for each commit.
- If your local hooks are not active, run:

```bash
npm run prepare
```

Manual check (optional):

```bash
npm run commitlint
```

## Pull Request Rules

- Keep PRs small and focused.
- Link related issue(s) when available.
- Include test steps in PR description.
- Update docs when behavior or setup changes.
- Ensure lint and format checks pass:

```bash
npm run lint
npm run format
```
