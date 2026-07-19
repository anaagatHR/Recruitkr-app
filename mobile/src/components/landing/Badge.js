import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { radius, spacing } from "../../theme/colors";

// Small pill badge shown above the hero heading (icon + short label).
export default function Badge({ icon = "sparkles", label, style }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.badge, style]}>
      <Ionicons name={icon} size={13} color={colors.accent} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.accentLight,
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: { color: colors.accentDark, fontWeight: "700", fontSize: 12.5 },
  });
