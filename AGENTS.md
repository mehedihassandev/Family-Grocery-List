# Agent Rules: Family Grocery List

## Project Overview

React Native + Expo grocery collaboration app with Firebase auth/data, Zustand state, NativeWind styling, and TanStack Query hooks for async data flows.

## Scope & Philosophy

- Use these rules for all new code and refactors.
- Keep legacy behavior working; migrate incrementally.
- Prefer extending existing project patterns over introducing new architecture styles.

## Project Structure & Architecture

```
src/
├── components/          # Reusable UI components
│   ├── skeletons/       # Reusable loading skeleton components
│   └── ui/              # Reusable presentational components (e.g., RhfTextfield, Buttons)
├── constants/           # App-level constants (e.g., query-keys.ts)
├── features/            # Feature-specific domains (e.g., auth, family, grocery)
│   └── <feature>/       # Feature folders containing domain models, helpers, or hooks
├── hooks/               # Custom hooks
│   └── queries/         # TanStack Query custom hooks
├── navigation/          # React Navigation setup and route registrations
├── screens/             # App screens (with co-located screen-specific subfiles/folders)
├── services/            # API, Firestore, and network service layers
├── store/               # Global state (Zustand + storage persistence)
├── styles/              # Global styling configurations (e.g., global.css)
├── theme/               # Colors and global design tokens
├── types/               # App-wide shared TypeScript declarations and navigation types
└── utils/               # Pure helper utilities and React Hook Form schemas
```

## Mandatory Coding Rules

### 1. Code Placement & Organization

- **Shared vs. Local Types**: Put shared interfaces/enums in `src/types`. Keep feature-specific models inside feature folders (`src/features/*`). Keep local-only types co-located with their files.
- **Custom Hooks**: Place custom hooks in `src/hooks`. Query hooks belong specifically in `src/hooks/queries`.
- **UI Components**: Place reusable presentational components in `src/components/ui`. Reusable skeleton/loading variants belong in `src/components/skeletons`. Use the existing `src/components` hierarchy before creating new top-level UI folders.
- **Screens**: Keep screens in `src/screens`. If a screen requires multiple support files (like local helpers, screen-specific constants, or styles), co-locate them in the screen's directory or screen subfolder.
- **Constants & Utilities**: Put app-level constants in `src/constants`. Place generic, pure helper utilities in `src/utils` (do not create a top-level `helper` folder).

### 2. Data Flow & State Management

- **Service Layer**: Keep network/data-access calls in `src/services` (or its subfolders). **Never** call Firebase or external API endpoints directly within screen components.
- **Asynchronous Queries**: Use TanStack Query combined with the service layer for async server/stateful data fetching. Add shared query keys in `src/constants/query-keys.ts` before using them in query hooks.
- **Global State**: Keep global persisted state in `src/store` using existing Zustand + persist patterns.
- **Forms**: Use existing React Hook Form (RHF) patterns and components (e.g., `src/components/ui/RhfTextfield.tsx`). Keep form validation schemas/models in `src/utils` unless a feature folder owns them.

### 3. Navigation & Styling

- **Type-Safe Navigation**: Ensure all navigation changes are type-safe:
  1. Update param types in `src/types/index.ts`
  2. Register routes/enums in `src/navigation/routes.ts`
  3. Wire navigators in `src/navigation/*Navigator.tsx`
- **Styling Best Practices**: Prefer theme tokens from `src/theme` and NativeWind classes. Avoid hardcoded styles and inline styles unless styling values are truly dynamic.

### 4. Code Hygiene & Styling

- **Error Handling**: Keep user-facing error messages clear and explicit. Do not silently swallow failures.
- **File Naming**: Keep filenames portable, clean, and consistent (no spaces, no trailing whitespace).
- **Imports**: Match the existing import style in surrounding files for consistency. The repository uses relative imports broadly; do not introduce inconsistent alias conventions.

---

## Do / Don't Examples

### File Placement & Access

- **Do:** Put Firestore queries in `src/services/family.ts`.
- **Don't:** Import `firebase/firestore` directly inside `src/screens/*`.
- **Do:** Put new query hooks in `src/hooks/queries/useXxxQueries.ts`.
- **Don't:** Create ad-hoc data-fetching logic inside screen components.
- **Do:** Put shared route params in `src/types/index.ts` and route enums in `src/navigation/routes.ts`.
- **Don't:** Hardcode route-name strings in multiple files.
- **Do:** Put shared presentational controls in `src/components/ui`.
- **Don't:** Duplicate button/input primitives across screen folders.

### Import Style

- **Do:** Match existing relative import style in surrounding files for consistency.
- **Don't:** Mix alias and relative imports inconsistently within the same module.

---

## Placement Priority

When conflicts arise, resolve them using this priority hierarchy:

1. Existing project conventions
2. These `AGENTS.md` rules
3. Local module consistency

---

## Setup & Run Commands

- **Install dependencies:** `npm install` (or `yarn install` if using yarn locally)
- **Start Metro bundler:** `npm run start`
- **Run Android app:** `npm run android`
- **Run iOS app:** `npm run ios`

---

## TypeScript & Code Style

- TypeScript strict mode is enabled; keep new code strict-compliant.
- Do not introduce `any`, unsafe casts, or `@ts-ignore` unless unavoidable (requires inline explanation).
- Prefer explicit types for public APIs (service results, hook return values, exported component props).
- Follow existing ESLint/Prettier formatting and import ordering.
- Do not leave `console.log` in committed code.

---

## Security & Reliability

- Never hardcode credentials, API keys, tokens, or secrets in source files.
- Do not log sensitive authentication/session data.
- Surface API/service errors with actionable messages instead of silent fallbacks.
- For auth/provider changes, follow `GOOGLE_SIGNIN_SETUP.md` and existing Firebase config patterns.

---

## Commit Conventions

- Commit messages must satisfy the configured conventional commit rules (`commitlint.config.cjs`).
- Use valid types like `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, etc.
