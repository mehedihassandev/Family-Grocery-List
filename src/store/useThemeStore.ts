import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "system" | "light" | "dark";

interface IThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

/**
 * Persisted Theme Store
 * Why: Manage user theme preference across app launches.
 */
export const useThemeStore = create<IThemeState>()(
  persist(
    (set) => ({
      themeMode: "system",
      setThemeMode: (themeMode: ThemeMode) => set({ themeMode }),
    }),
    {
      name: "app-theme-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
