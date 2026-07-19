import React, { useMemo } from "react";
import { Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { radius, spacing } from "../../theme/colors";
import { tap } from "../../utils/haptics";

// Quick job-type filter chips. Controlled: parent owns `value` and filters the
// list. `null` means "All". Options map to Job.jobType values.
export const QUICK_FILTERS = [
  { key: null, label: "All" },
  { key: "remote", label: "Remote" },
  { key: "internship", label: "Internship" },
  { key: "freelance", label: "Freelance" },
  { key: "part-time", label: "Part-time" },
];

export default function QuickFilters({ value, onChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {QUICK_FILTERS.map((f) => {
        const active = value === f.key;
        return (
          <Pressable
            key={f.label}
            onPress={() => { tap(); onChange?.(f.key); }}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    row: { gap: spacing.sm, paddingRight: spacing.lg },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 9,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.textMuted, fontWeight: "700", fontSize: 13 },
    chipTextActive: { color: "#FFFFFF" },
  });
