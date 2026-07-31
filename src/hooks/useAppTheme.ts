import { useEffect } from "react";
import { useColorScheme } from "nativewind";
import { useThemeStore, ThemeMode } from "../store/useThemeStore";
import { appThemeColors } from "../theme";

/**
 * Custom App Theme Hook
 * Why: Provides centralized, clean theme management for Light and Dark modes.
 * Returns theme state (isDark), centralized colors (colors.accent, colors.icon, etc.), and theme switcher handler.
 */
export const useAppTheme = () => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { themeMode, setThemeMode: setStoreThemeMode } = useThemeStore();

  useEffect(() => {
    if (themeMode === "dark" && colorScheme !== "dark") {
      setColorScheme("dark");
    } else if (themeMode === "light" && colorScheme !== "light") {
      setColorScheme("light");
    } else if (themeMode === "system" && colorScheme !== undefined) {
      setColorScheme("system" as any);
    }
  }, [themeMode, colorScheme, setColorScheme]);

  const setThemeMode = (mode: ThemeMode) => {
    setStoreThemeMode(mode);
    setColorScheme(mode as any);
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
