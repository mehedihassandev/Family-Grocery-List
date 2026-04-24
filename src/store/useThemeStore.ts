import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "nativewind";

/**
 * Theme mode options
 */
export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

/**
 * Store for managing application theme preference
 * Why: To provide a global way to toggle and persist theme settings
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (theme: ThemeMode) => {
        set({ theme });
      },
      toggleTheme: () => {
        const current = get().theme;
        const next = current === "light" ? "dark" : "light";
        set({ theme: next });
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
