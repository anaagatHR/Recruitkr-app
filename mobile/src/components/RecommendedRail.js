import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

/**
 * Horizontal "Recommended for you" rail, shared by the home screen and the
 * applications dashboard. Feed it whatever `getRecommendations()` returned —
 * rule-based or AI — it only reads `matchScore` / `matchReasons`.
 *
 * props:
 *   jobs      [{ ...job, matchScore, matchReasons }]
 *   onPress   (job) => void
 *   title     section heading
 *   aiPowered show the "AI" pill (server matcher was used)
 *   loading   render placeholder cards
 */
export default function RecommendedRail({
  jobs = [],
  onPress,
  title = "Recommended for you",
  subtitle,
  aiPowered = false,
  loading = false,
}) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  if (!loading && jobs.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.pill}>
              <Ionicons name="sparkles" size={11} color={colors.primary} />
              <Text style={styles.pillText}>{aiPowered ? "AI" : "Smart match"}</Text>
            </View>
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {loading
          ? [0, 1, 2].map((i) => <View key={i} style={[styles.card, styles.cardGhost]} />)
          : jobs.map((job) => (
              <TouchableOpacity
                key={job._id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => onPress?.(job)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.logo}>
                    <Text style={styles.logoText}>
                      {(job.company || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  {typeof job.matchScore === "number" && (
                    <View style={[styles.match, { backgroundColor: tint(job.matchScore, colors) }]}>
                      <Text style={[styles.matchText, { color: matchColor(job.matchScore, colors) }]}>
                        {job.matchScore}%
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
                <Text style={styles.company} numberOfLines={1}>{job.company}</Text>

                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.meta} numberOfLines={1}>{job.location}</Text>
                </View>

                {job.matchReasons?.length ? (
                  <View style={styles.reason}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.accentDark} />
                    <Text style={styles.reasonText} numberOfLines={2}>{job.matchReasons[0]}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
      </ScrollView>
    </View>
  );
}

const matchColor = (s, colors) =>
  s >= 75 ? colors.success : s >= 50 ? colors.warning : colors.textMuted;
const tint = (s, colors) => matchColor(s, colors) + "22";

const makeStyles = (colors, isDark) => StyleSheet.create({
  section: { paddingTop: spacing.lg },
  head: { paddingHorizontal: spacing.lg },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontSize: 18, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: colors.primaryLight, borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  pillText: { fontSize: 10, fontWeight: "800", color: colors.primary, letterSpacing: 0.3 },
  rail: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  card: {
    width: 210, backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  cardGhost: { height: 168, opacity: 0.5 },
  cardTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  logo: {
    width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 16, fontWeight: "800", color: colors.primary },
  match: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  matchText: { fontSize: 11, fontWeight: "800" },
  jobTitle: { fontSize: 15, fontWeight: "700", color: colors.text, minHeight: 38 },
  company: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: spacing.sm },
  meta: { fontSize: 12, color: colors.textMuted, flex: 1 },
  reason: {
    flexDirection: "row", alignItems: "flex-start", gap: 4,
    marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  reasonText: { fontSize: 11, color: colors.accentDark, fontWeight: "600", flex: 1, lineHeight: 15 },
});
