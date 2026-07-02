// RecruitKR brand palette - taken from the official logo (navy blue + green).
// Two themes: light (default) and dark. Brand colors stay the same in both.

export const lightColors = {
  primary: "#274B7F", // logo navy blue ("Recruit")
  primaryDark: "#1D3A63",
  primaryLight: "#E8EEF6",
  accent: "#6AA843", // logo green ("Kr" / arrow / "Hiring")
  accentDark: "#558A35",
  accentLight: "#EEF6E6",

  background: "#F6F8FA",
  surface: "#FFFFFF",
  border: "#E4E8EC",

  text: "#1A2330",
  textMuted: "#6B7785",
  textLight: "#9AA5B1",

  success: "#1E8E3E",
  danger: "#D93025",
  warning: "#F5A623",
  info: "#1A73E8",

  white: "#FFFFFF",
  black: "#000000",
};

export const darkColors = {
  primary: "#3D6BAE", // slightly brighter navy so it pops on dark
  primaryDark: "#2A4E80",
  primaryLight: "#1E2D45",
  accent: "#7CBF52", // brighter green for dark bg
  accentDark: "#5E9C3C",
  accentLight: "#1E2A18",

  background: "#0F141B",
  surface: "#1A2330",
  border: "#2A3441",

  text: "#ECEFF3",
  textMuted: "#9AA5B1",
  textLight: "#6B7785",

  success: "#3DB66A",
  danger: "#F2685C",
  warning: "#F5B33F",
  info: "#5B9DF0",

  white: "#FFFFFF",
  black: "#000000",
};

// Default export stays light so every file that does `import { colors }`
// keeps working (and renders light) until migrated to the useTheme() hook.
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

// Soft card shadow. Pass isDark to soften/remove on dark backgrounds.
export function shadow(isDark = false) {
  if (isDark) {
    return { elevation: 2 }; // subtle on Android; iOS dark looks best with none
  }
  return {
    shadowColor: "#1A2330",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  };
}
