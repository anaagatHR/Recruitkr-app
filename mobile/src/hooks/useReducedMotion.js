import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// True when the OS "reduce motion" setting is on — components use this to
// fall back to static layouts instead of looping animations.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => mounted && setReduced(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (v) =>
      setReduced(!!v)
    );
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
}
