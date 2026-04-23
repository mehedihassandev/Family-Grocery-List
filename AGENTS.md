# Family Grocery List - Agent Instructions

This document provides context to AI coding agents to help them be immediately productive in this codebase.

## Project Overview

- **Framework:** React Native with Expo (Dev Client / Bare workflow since `android/` directory is present).
- **Styling:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native).
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/).
- **Navigation:** React Navigation v7 (Native Stack & Bottom Tabs).
- **Backend & Auth:** Firebase and Google Sign-in.
- **Language:** TypeScript.

## Architecture & Directory Structure

All main application code is contained in [src/](src/):
- [src/components/](src/components) - Reusable UI components.
- [src/screens/](src/screens) - Application screens and views.
- [src/navigation/](src/navigation) - React Navigation setup.
- [src/services/](src/services) - Firebase integration and external API services.
- [src/store/](src/store) - Zustand state stores (e.g., `useAuthStore.ts`).
- [src/styles/](src/styles) - Global CSS files for NativeWind configuration.
- [src/types/](src/types) - Shared TypeScript interfaces.

## Key Commands

Agents can run these local commands to test the application:
- `npm run start` - Starts the Expo development server.
- `npm run android` - Builds and runs the Android app (`expo run:android`).
- `npm run ios` - Builds and runs the iOS app (`expo run:ios`).

## Important Context & Documentation

- **Authentication:** For Google Sign-in via `expo-auth-session` and Firebase integration details, refer to [GOOGLE_SIGNIN_SETUP.md](GOOGLE_SIGNIN_SETUP.md). Avoid hardcoding keys or altering the auth flow without consulting this setup guide.

## Development Guidelines

1. **State Management:** Use Zustand for global state. Do not introduce Redux or Context API unless absolutely unavoidable.
2. **Styling:** Use NativeWind class names for styling components. Avoid `StyleSheet.create` unless required for dynamic layout calculations.
3. **Type Safety:** Always write strict TypeScript. When accessing external data or state, ensure standard types are utilized from the `src/types/` folder.
