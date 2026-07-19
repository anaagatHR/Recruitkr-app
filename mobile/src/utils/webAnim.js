import { Platform } from "react-native";

// On web, React Native's Animated ignores useNativeDriver and runs every loop on
// the main JS thread (requestAnimationFrame) — many concurrent loops saturate the
// thread and block clicks. react-native-web supports real CSS animations via the
// `animationKeyframes` style props, which run GPU-composited OFF the main thread.
// So: use CSS animations on web, native-driver Animated on native.
export const isWeb = Platform.OS === "web";

// Returns a react-native-web CSS-animation style (or null on native, so callers
// can spread it safely and keep their Animated path untouched).
export function cssLoop(keyframes, durationSec, { timing = "linear", delayMs = 0 } = {}) {
  if (!isWeb) return null;
  return {
    animationKeyframes: keyframes,
    animationDuration: `${durationSec}s`,
    animationIterationCount: "infinite",
    animationTimingFunction: timing,
    animationDelay: `${delayMs}ms`,
  };
}
