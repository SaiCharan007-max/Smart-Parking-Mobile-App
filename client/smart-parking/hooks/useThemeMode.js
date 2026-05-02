import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { themes } from "../theme";

const STORAGE_KEY = "theme-mode";
const ThemeModeContext = React.createContext(null);

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = React.useState("dark");
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored && themes[stored]) {
          setMode(stored);
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  const updateMode = React.useCallback(async (nextMode) => {
    const normalized = themes[nextMode] ? nextMode : "dark";
    setMode(normalized);
    await AsyncStorage.setItem(STORAGE_KEY, normalized);
  }, []);

  const toggleMode = React.useCallback(() => {
    const next = mode === "dark" ? "light" : "dark";
    updateMode(next);
  }, [mode, updateMode]);

  const value = React.useMemo(
    () => ({ mode, theme: themes[mode] || themes.dark, isReady, toggleMode, setMode: updateMode }),
    [mode, isReady, toggleMode, updateMode]
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const ctx = React.useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode must be used inside ThemeModeProvider");
  return ctx;
}
