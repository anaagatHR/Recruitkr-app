import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import { LanguageProvider } from "./src/i18n/LanguageContext";
import { SavedJobsProvider } from "./src/context/SavedJobsContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { ToastProvider } from "./src/context/ToastContext";
import { NotificationsProvider } from "./src/context/NotificationsContext";
import { RecentlyViewedProvider } from "./src/context/RecentlyViewedContext";
import { JobAlertsProvider } from "./src/context/JobAlertsContext";
import { ensureNotifPermission } from "./src/services/localNotify";
import ErrorBoundary from "./src/components/ErrorBoundary";
import RootNavigator from "./src/navigation/RootNavigator";

// Inner component so it can read the current theme via the hook.
function ThemedApp() {
  const { colors, isDark } = useTheme();

  // Ask for notification permission once at startup (best-effort).
  useEffect(() => { ensureNotifPermission(); }, []);

  // Make React Navigation's container background match the theme
  // (prevents a white flash between screens in dark mode).
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.surface}
      />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <LanguageProvider>
            <AuthProvider>
              <SavedJobsProvider>
                <RecentlyViewedProvider>
                  <JobAlertsProvider>
                    <NotificationsProvider>
                      <ThemedApp />
                    </NotificationsProvider>
                  </JobAlertsProvider>
                </RecentlyViewedProvider>
              </SavedJobsProvider>
            </AuthProvider>
          </LanguageProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}
