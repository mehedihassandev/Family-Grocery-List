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

## Environment Validation Checklist

Before reporting auth/onboarding issues, verify:

- `.env` exists and is copied from `.env.example`.
- All `EXPO_PUBLIC_FIREBASE_*` and Google client ID values are set.
- Firebase Authentication provider is enabled for the flow you test.
- Firestore database exists and rules are deployed.
- Native app is rebuilt after credential/config changes.

Common failure symptoms:

- `auth/invalid-api-key` -> invalid/missing Firebase API key.
- Google popup completes but sign-in fails -> wrong platform client ID.
- `permission-denied` when creating/joining family -> Firestore rules not deployed.

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

## Releases and Versioning

- Version numbers follow Semantic Versioning.
- Tagging `v*` (for example `v1.2.0`) triggers the GitHub release workflow.
- Update `CHANGELOG.md` under `Unreleased` as part of feature/fix PRs.

## Pull Request Rules

- Keep PRs small and focused.
- Link related issue(s) when available.
- Include test steps in PR description.
- Update docs when behavior or setup changes.
- Ensure checks pass locally:

```bash
npm run lint
npm run format
npm run type-check
npm run test
```

## Labels and Starter Issues

Maintainers should use labels to guide onboarding:

- `good first issue`: small, isolated, low-risk tasks for first-time contributors.
- `help wanted`: tasks open for community contribution, may need more context.
- `bug`, `enhancement`, `documentation`, `ci`, `testing`: scope classification.

When creating starter issues:

- Keep acceptance criteria concrete and testable.
- Link relevant files and setup docs.
- Add implementation constraints to reduce ambiguity.
