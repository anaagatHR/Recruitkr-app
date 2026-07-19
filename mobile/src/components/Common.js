import React, { useMemo } from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { getStage, stageColor, tintBg } from "../utils/applicationStages";

export function Loading({ text = "Loading..." }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

export function EmptyState({ icon = "file-tray-outline", title, subtitle }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={56} color={colors.textLight} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
    </View>
  );
}

export function ErrorState({
  title = "Something went wrong",
  subtitle = "Please check your connection and try again.",
  onRetry,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={56} color={colors.textLight} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.muted}>{subtitle}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Ionicons name="refresh" size={18} color={colors.white} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Chip({ label, active, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Text onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      {label}
    </Text>
  );
}

export function StatusBadge({ status, withIcon = false }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Labels/colours come from the shared pipeline config so the badge, the
  // progress tracker and the dashboard filters can never drift apart.
  const stage = getStage(status);
  const fg = stageColor(status, colors);
  return (
    <View style={[styles.statusBadge, withIcon && styles.statusBadgeIcon, { backgroundColor: tintBg(fg, isDark) }]}>
      {withIcon ? <Ionicons name={stage.icon} size={12} color={fg} /> : null}
      <Text style={[styles.statusText, { color: fg }]}>{stage.label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  muted: { color: colors.textMuted, marginTop: spacing.sm, textAlign: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: spacing.md },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border,
    color: colors.textMuted, fontSize: 13, fontWeight: "600",
    marginRight: spacing.sm, overflow: "hidden",
  },
  chipActive: {
    backgroundColor: colors.primary, borderColor: colors.primary, color: colors.white,
  },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: 999 },
  statusBadgeIcon: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusText: { fontSize: 12, fontWeight: "700" },
  retryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    marginTop: spacing.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary, borderRadius: radius.md,
  },
  retryText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});
