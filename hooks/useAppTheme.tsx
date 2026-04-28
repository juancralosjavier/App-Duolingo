import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { palette, type AppThemeName } from "../constants/palette";
import { getStoredItem, setStoredItem } from "../services/sessionStorage";
import { useAuth } from "./useAuth";

const THEME_STORAGE_KEY = "@matecamba_theme";

interface ThemeContextType {
  themeName: AppThemeName;
  theme: (typeof palette)[AppThemeName];
  setThemeName: (themeName: AppThemeName) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [themeName, setThemeNameState] = useState<AppThemeName>("light");

  useEffect(() => {
    (async () => {
      const stored = await getStoredItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        setThemeNameState(stored);
      }
    })();
  }, []);

  useEffect(() => {
    if (user?.themePreference === "light" || user?.themePreference === "dark") {
      setThemeNameState(user.themePreference);
      void setStoredItem(THEME_STORAGE_KEY, user.themePreference);
    }
  }, [user?.themePreference]);

  const setThemeName = useCallback(async (nextTheme: AppThemeName) => {
    setThemeNameState(nextTheme);
    await setStoredItem(THEME_STORAGE_KEY, nextTheme);
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextTheme = themeName === "light" ? "dark" : "light";
    await setThemeName(nextTheme);
  }, [setThemeName, themeName]);

  const value = useMemo(
    () => ({
      themeName,
      theme: palette[themeName],
      setThemeName,
      toggleTheme,
    }),
    [setThemeName, themeName, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }

  return context;
}
