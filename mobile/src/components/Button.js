import React, { useRef, useMemo } from "react";
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet, Animated } from "react-native";
import { radius, spacing } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

export default function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary", // primary | outline | accent
  style,
}) {
  const isDisabled = disabled || loading;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Press scale feedback
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          variant === "primary" && styles.primary,
          variant === "accent" && styles.accent,
          variant === "outline" && styles.outline,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variant === "outline" ? colors.primary : colors.white} />
        ) : (
          <Text style={[styles.text, variant === "outline" && styles.textOutline]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.primary },
  accent: { backgroundColor: colors.accent },
  outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary },
  disabled: { opacity: 0.6 },
  text: { color: colors.white, fontSize: 16, fontWeight: "700" },
  textOutline: { color: colors.primary },
});
