import React, { createContext, useContext, useCallback, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./ThemeContext";
import { isWeb } from "../utils/webAnim";
import { spacing, radius, shadow } from "../theme/colors";

const ToastContext = createContext(null);

/**
 * Lightweight non-blocking toast. Call `toast.show("Saved", { type: "success" })`
 * from anywhere. Types: success | error | info. Auto-dismisses.
 */
export function ToastProvider({ children }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null); // { message, type }
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);

  // On web there is no native animated module, so fade instantly instead of
  // running the tween on the JS thread.
  const hide = useCallback(() => {
    if (isWeb) { opacity.setValue(0); setToast(null); return; }
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setToast(null)
    );
  }, [opacity]);

  const show = useCallback(
    (message, opts = {}) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, type: opts.type || "info" });
      if (isWeb) opacity.setValue(1);
      else Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      hideTimer.current = setTimeout(hide, opts.duration || 2200);
    },
    [opacity, hide]
  );

  const value = useMemo(() => ({ show }), [show]);

  const meta = {
    success: { icon: "checkmark-circle", color: colors.success },
    error: { icon: "alert-circle", color: colors.danger },
    info: { icon: "information-circle", color: colors.primary },
  }[toast?.type || "info"];

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            {
              opacity,
              bottom: insets.bottom + 80,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              ...shadow(isDark),
            },
          ]}
        >
          <Ionicons name={meta.icon} size={20} color={meta.color} />
          <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext) || { show: () => {} };

const styles = StyleSheet.create({
  wrap: {
    position: "absolute", left: spacing.lg, right: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.md, borderWidth: 1,
  },
  text: { flex: 1, fontSize: 14, fontWeight: "600" },
});
