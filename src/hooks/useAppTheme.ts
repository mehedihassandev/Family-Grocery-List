import { useEffect } from "react";
import { useColorScheme } from "nativewind";
import { useThemeStore, ThemeMode } from "../store/useThemeStore";
import { appThemeColors } from "../theme";

/**
 * Root App Theme Synchronization Hook
 * Why: Synchronizes Zustand theme store with NativeWind's color scheme ONCE at the app root level.
 * Using requestAnimationFrame defers NativeWind event emissions so they don't interrupt React component mount passes.
 */
export const useSyncAppTheme = () => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const themeMode = useThemeStore((state) => state.themeMode);

  useEffect(() => {
    let targetScheme: "dark" | "light" | "system" | undefined;
    if (themeMode === "dark" && colorScheme !== "dark") {
      targetScheme = "dark";
    } else if (themeMode === "light" && colorScheme !== "light") {
      targetScheme = "light";
    } else if (themeMode === "system" && colorScheme !== undefined) {
      targetScheme = "system";
    }

    if (targetScheme) {
      const handle = requestAnimationFrame(() => {
        setColorScheme(targetScheme as any);
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [themeMode, colorScheme, setColorScheme]);
};

/**
 * Custom App Theme Hook
 * Why: Provides centralized, clean presentational theme state (isDark), colors, and theme toggle handler for components.
 */
export const useAppTheme = () => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { themeMode, setThemeMode: setStoreThemeMode } = useThemeStore();

  const setThemeMode = (mode: ThemeMode) => {
    setStoreThemeMode(mode);
    requestAnimationFrame(() => {
      setColorScheme(mode as any);
    });
  };

  const isDark = colorScheme === "dark" || themeMode === "dark";
  const colors = isDark ? appThemeColors.dark : appThemeColors.light;

  return {
    isDark,
    colors,
    themeMode,
    setThemeMode,
    colorScheme,
  };
};
