# Agent Rules: Family Grocery List

## Project Overview

React Native + Expo grocery collaboration app with Firebase auth/data, Zustand state, NativeWind styling, and TanStack Query hooks for async data flows.

## Scope

- Use these rules for all new code and refactors.
- Keep legacy behavior working; migrate incrementally.
- Prefer extending existing project patterns over introducing new architecture styles.

## Verified App Structure

- Main app code is under `src/`.
- Shared types and navigation types are in `src/types`.
- Domain-specific modeling also exists in feature folders (for example `src/features/grocery/model.ts`).
- Hooks are in `src/hooks` (including `src/hooks/queries` for TanStack Query hooks).
- Reusable components are in `src/components`, with `src/components/ui` and `src/components/skeletons` already used.
- Screens currently live in `src/screens` (mostly flat, with some feature subfolders like `src/screens/Dashboard`).
- Navigation is in `src/navigation`.
- Data access and API/service logic is in `src/services`.
- Global app state (Zustand) is in `src/store`.
- App constants are in `src/constants`.
- Shared utility functions are in `src/utils`.
- Theme tokens are in `src/theme`; NativeWind global styles are in `src/styles/global.css`.

## Mandatory Rules

1. Put shared interfaces/enums in `src/types`; keep feature-specific models inside feature folders (`src/features/*`).
2. Keep local-only types co-located (or in `src/types` when broadly reused).
3. Place custom hooks in `src/hooks`; query hooks belong in `src/hooks/queries`.
4. Place reusable presentational components in `src/components/ui`; use existing `src/components` structure before creating new top-level UI folders.
5. Place skeleton/loading variants in `src/components/skeletons` when they are reusable.
6. Keep screens in `src/screens`; if a feature needs multiple support files, create/extend a feature subfolder under `src/screens/<Feature>/`.
7. Keep support files (`styles.ts`, local helpers, constants) co-located with their screen when they are screen-specific.
8. Put app-level constants in `src/constants`.
9. Keep network/data-access calls in `src/services` (or existing service subfolders). Do not call Firebase/network APIs directly in screen components.
10. Add shared query keys in `src/constants/query-keys.ts` before using them in query hooks.
11. Use TanStack Query + service layer for async server/stateful data fetching.
12. Put generic pure helpers in `src/utils`; do not create a new top-level `helper` folder.
13. Use existing RHF patterns/components (`src/components/ui/RhfTextfield.tsx`) and keep form schemas/models in `src/utils` unless a feature folder already owns them.
14. Keep navigation changes type-safe:
    - update param types in `src/types/index.ts`
    - register routes/enums in `src/navigation/routes.ts`
    - wire navigators in `src/navigation/*Navigator.tsx`
15. Keep global persisted state in `src/store` using existing Zustand + persist patterns.
16. Prefer theme tokens from `src/theme` and NativeWind classes; avoid hardcoded values and avoid inline styles unless truly dynamic.
17. Keep user-facing error messages clear and explicit; do not silently swallow failures.
18. Keep filenames portable and clean (no spaces, no trailing whitespace).
19. Add or update tests when behavior changes; follow existing `*.test.ts`/`*.test.tsx` co-located patterns.
20. Follow existing import style in the file/module (the repo currently uses relative imports broadly; do not introduce inconsistent alias conventions).

## Do / Don't Examples

### File placement

- **Do:** put Firestore operations in `src/services/family.ts`.
- **Don't:** call `firebase/firestore` directly inside `src/screens/*`.

- **Do:** put new query hooks in `src/hooks/queries/useXxxQueries.ts`.
- **Don't:** create ad-hoc fetch logic in screen components.

- **Do:** put shared route params in `src/types/index.ts` and route enums in `src/navigation/routes.ts`.
- **Don't:** hardcode route-name strings in multiple files.

- **Do:** put shared presentational controls in `src/components/ui`.
- **Don't:** duplicate button/input primitives across screen folders.

### Import style

- **Do:** match existing import style in surrounding files for consistency.
- **Don't:** mix alias and relative imports inconsistently within the same module.

### Testing

- **Do:** update or add a nearby `*.test.ts`/`*.test.tsx` when logic changes.
- **Don't:** merge behavior changes without covering the changed code path.

## Placement Priority

When there is a conflict, follow this order:
1. existing project convention
2. these AGENTS.md rules
3. local module consistency

## Setup & Run Commands

- Install dependencies: `npm install` (or `yarn install` if using yarn locally)
- Start Metro: `npm run start`
- Run Android app: `npm run android`
- Run iOS app: `npm run ios`

## Validation Commands

- Lint: `npm run lint`
- Lint fix: `npm run lint:fix`
- Format check: `npm run format`
- Format fix: `npm run format:fix`
- Test: `npm run test`
- Type check: `npm run type-check`

## Testing Instructions

- Run `npm run test` for the full Vitest suite.
- For changed behavior, add/update nearby `*.test.ts`/`*.test.tsx` files and keep tests co-located by feature/service.
- Run `npm run lint` and `npm run type-check` for code changes before finalizing.

## TypeScript & Code Style

- TypeScript strict mode is enabled; keep new code strict-compliant.
- Do not introduce `any`, unsafe casts, or `@ts-ignore` unless unavoidable with inline rationale.
- Prefer explicit types for public APIs (service results, hook return values, exported component props).
- Follow existing ESLint/Prettier formatting and import ordering.
- Do not leave `console.log` in committed code.

## Security & Reliability

- Never hardcode credentials, API keys, tokens, or secrets in source files.
- Do not log sensitive auth/session data.
- Surface API/service errors with actionable messages instead of silent fallbacks.
- For auth/provider changes, follow `GOOGLE_SIGNIN_SETUP.md` and existing Firebase config patterns.

## Commit Conventions

- Commit messages must satisfy the configured conventional commit rules (`commitlint.config.cjs`).
- Use valid types like `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, etc.
