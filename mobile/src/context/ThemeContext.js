import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightColors, darkColors } from "../theme/colors";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // mode: "light" | "dark" | "system"
  const [mode, setModeState] = useState("system");
  const systemScheme = useColorScheme(); // "light" | "dark" | null

  // Restore saved preference
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("theme");
      if (saved === "light" || saved === "dark" || saved === "system") {
        setModeState(saved);
      }
    })();
  }, []);

  const isDark =
    mode === "dark" || (mode === "system" && systemScheme === "dark");
  const colors = isDark ? darkColors : lightColors;

  const setMode = useCallback((next) => {
    setModeState(next);
    AsyncStorage.setItem("theme", next).catch(() => {});
  }, []);

  // Simple toggle between light and dark (ignores system once toggled)
  const toggleTheme = useCallback(() => {
    setMode(isDark ? "light" : "dark");
  }, [isDark, setMode]);

  const value = useMemo(
    () => ({ colors, mode, isDark, setMode, toggleTheme }),
    [colors, mode, isDark, setMode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
