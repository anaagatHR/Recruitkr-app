import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { radius, spacing } from "../../theme/colors";

// Horizontal journey stepper with a connecting line. `active` = current step
// index (0-based); steps up to and including it are highlighted.
const STEPS = [
  { icon: "search", label: "Search" },
  { icon: "send", label: "Apply" },
  { icon: "chatbubbles", label: "Chat" },
  { icon: "calendar", label: "Track" },
  { icon: "trophy", label: "Hired" },
];

export default function StepTracker({ active = 0 }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      {/* connecting line behind the circles */}
      <View style={styles.lineTrack} />
      <View
        style={[
          styles.lineFill,
          { width: `${(active / (STEPS.length - 1)) * 100}%` },
        ]}
      />
      <View style={styles.row}>
        {STEPS.map((s, i) => {
          const done = i <= active;
          return (
            <View key={s.label} style={styles.step}>
              <View style={[styles.circle, done ? styles.circleActive : styles.circleIdle]}>
                <Ionicons name={s.icon} size={16} color={done ? "#FFFFFF" : colors.textMuted} />
              </View>
              <Text style={[styles.label, done && styles.labelActive]} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    wrap: { marginTop: spacing.lg, justifyContent: "center" },
    lineTrack: {
      position: "absolute",
      top: 17,
      left: "10%",
      right: "10%",
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.border,
    },
    lineFill: {
      position: "absolute",
      top: 17,
      left: "10%",
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.accent,
    },
    row: { flexDirection: "row", justifyContent: "space-between" },
    step: { alignItems: "center", flex: 1 },
    circle: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
    },
    circleIdle: { backgroundColor: colors.surface, borderColor: colors.border },
    circleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    label: { color: colors.textMuted, fontSize: 11, fontWeight: "600", marginTop: 5 },
    labelActive: { color: colors.text, fontWeight: "800" },
  });
