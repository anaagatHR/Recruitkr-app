import React, { useMemo, useState, useRef, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius, spacing } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { isWeb } from "../utils/webAnim";

// Shared text field. Backward compatible — `icon` (leading), `error` (inline
// message + shake), and a focus glow are all optional additions.
export default function Input({ label, style, secureTextEntry, icon, error, onFocus, onBlur, ...props }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const isPassword = Boolean(secureTextEntry);
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  // Shake horizontally when an error appears.
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // No native driver on web — skip the shake, the red border already signals it.
    if (!error || isWeb) return;
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0.6, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [error, shake]);

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View
        style={[
          styles.inputRow,
          { borderColor, transform: [{ translateX }] },
          focused && !error && styles.focusGlow,
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={19} color={focused ? colors.primary : colors.textMuted} style={styles.leftIcon} />
        ) : null}
        <TextInput
          placeholderTextColor={colors.textLight}
          style={[styles.input, icon && styles.inputWithLeft, isPassword && styles.inputWithRight]}
          secureTextEntry={isPassword ? hidden : false}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity
            style={styles.eye}
            onPress={() => setHidden((h) => !h)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Ionicons name={hidden ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </Animated.View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = (colors, isDark) =>
  StyleSheet.create({
    wrap: { marginBottom: spacing.lg },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
      marginBottom: spacing.xs + 2,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
    },
    focusGlow: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isDark ? 0.5 : 0.25,
      shadowRadius: 6,
      elevation: 2,
    },
    leftIcon: { marginLeft: spacing.lg },
    input: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      fontSize: 15,
      color: colors.text,
    },
    inputWithLeft: { paddingLeft: spacing.sm },
    inputWithRight: { paddingRight: 44 },
    eye: { position: "absolute", right: spacing.md, height: "100%", justifyContent: "center" },
    errorText: { color: colors.danger, fontSize: 12.5, fontWeight: "600", marginTop: 5 },
  });
