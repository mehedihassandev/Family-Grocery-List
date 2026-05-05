# Architecture Overview

This document provides a quick map of the application architecture for contributors and coding agents.

## Tech Stack

- **App runtime:** React Native + Expo (with `android/` and `ios/` native projects)
- **Language:** TypeScript (strict mode)
- **State:** Zustand (`src/store`)
- **Data fetching/cache:** TanStack Query (`src/hooks/queries`)
- **Backend:** Firebase Auth + Firestore (`src/services`)
- **Navigation:** React Navigation v7 (`src/navigation`)
- **Styling:** NativeWind + theme tokens (`src/styles`, `src/theme`)

## High-Level Module Map

```text
src/
|- components/        # Reusable UI and composed view blocks
|- constants/         # Query keys and app-level constants
|- features/          # Domain-specific models/helpers
|- hooks/             # Shared hooks + query hooks
|- navigation/        # Navigators and route enums
|- screens/           # Screen entry points and feature views
|- services/          # Firebase/data-access functions
|- store/             # Zustand persisted global state
|- theme/             # Design tokens/theme helpers
|- types/             # Shared interfaces and navigation types
|- utils/             # Reusable utility and validation helpers
```

## Runtime Flow

1. App loads and hydrates persisted auth state from Zustand.
2. Root navigation decides auth stack vs unauthenticated stack.
3. Screens call hooks (especially query hooks).
4. Hooks call service-layer functions.
5. Services read/write Firebase Auth + Firestore.
6. Query cache and Firestore snapshots keep UI state in sync.

## Data-Access Rules

- Keep all network/Firestore/auth calls in `src/services`.
- Keep query wiring in `src/hooks/queries`.
- Do not call Firebase directly from screen components.
- Add/maintain query keys in `src/constants/query-keys.ts`.

## Navigation and Type Safety

- Route enums live in `src/navigation/routes.ts`.
- Route param types and screen prop helpers live in `src/types/index.ts`.
- Navigator registrations live in `src/navigation/*Navigator.tsx`.
- When adding a route, update all three to keep compile-time safety.

## State Ownership

- **Global persisted state:** `src/store` (auth/session and cross-screen state).
- **Server/cache state:** TanStack Query in `src/hooks/queries`.
- **Local component state:** inside screen/component where possible.

## Contribution Notes

- Prefer extending existing patterns over introducing new architectural styles.
- Add tests near changed logic using existing `*.test.ts` / `*.test.tsx` patterns.
- Keep error handling explicit; avoid silent failures.
