import React, { useRef, useMemo } from "react";
import { Text, StyleSheet, Animated, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { radius, spacing, shadow } from "../../theme/colors";
import { tap } from "../../utils/haptics";
import { isWeb } from "../../utils/webAnim";

// Solid-gradient pill CTA with an arrow icon and a press scale/lift effect.
export default function GradientButton({ title, onPress, icon = "arrow-forward", style }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const scale = useRef(new Animated.Value(1)).current;

  // Skipped on web — the spring would run on the JS thread on every press.
  const to = (v) => {
    if (isWeb) return;
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.wrap, style]}>
      <Pressable
        onPress={() => { tap(); onPress?.(); }}
        onPressIn={() => to(0.96)}
        onPressOut={() => to(1)}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.grad}
        >
          <Text style={styles.text}>{title}</Text>
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (colors, isDark) =>
  StyleSheet.create({
    wrap: { borderRadius: radius.pill, ...shadow(isDark) },
    grad: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: 15,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.pill,
    },
    text: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  });
