import React, { useRef, useEffect, useMemo, useCallback, memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius, spacing, shadow } from "../theme/colors";
import { useSavedJobs } from "../context/SavedJobsContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { postedAgo } from "../utils/time";
import { tap } from "../utils/haptics";

const TYPE_LABELS = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  remote: "Remote",
  internship: "Internship",
  freelance: "Freelance",
  gig: "Gig",
};

function formatSalary(min, max) {
  if (!min && !max) return "Salary not disclosed";
  const f = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${Math.round(n / 1000)}K`);
  if (min && max) return `₹${f(min)} - ₹${f(max)}`;
  return `₹${f(min || max)}`;
}

function JobCard({ job, onPress, showSave = true, index = 0 }) {
  const initial = (job.company || "?").charAt(0).toUpperCase();
  const saved = useSavedJobs();
  const isSaved = saved?.isSaved(job._id);
  const toast = useToast();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  // Staggered entrance: fade + slide up, driven off mount only.
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay: Math.min(index, 8) * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  // Press scale feedback
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = useCallback(
    () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start(),
    []
  );
  const pressOut = useCallback(
    () => Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start(),
    []
  );
  const onToggleSave = useCallback(() => {
    tap();
    const wasSaved = saved?.isSaved(job._id);
    saved?.toggleSave(job);
    toast.show(wasSaved ? "Removed from saved" : "Saved ✓", { type: "success" });
  }, [saved, job, toast]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          { scale },
        ],
      }}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.card}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
            <Text style={styles.company} numberOfLines={1}>{job.company}</Text>
          </View>
          {showSave && saved ? (
            <TouchableOpacity
              onPress={onToggleSave}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.saveBtn}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={22}
                color={isSaved ? colors.accent : colors.textLight}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{TYPE_LABELS[job.jobType] || job.jobType}</Text>
          </View>
          <View style={styles.easyBadge}>
            <Ionicons name="flash" size={11} color={colors.accentDark} />
            <Text style={styles.easyText}>Easy Apply</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{job.location}</Text>
          </View>
          <View style={styles.meta}>
            <Ionicons name="briefcase-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{job.category}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.salary}>{formatSalary(job.salaryMin, job.salaryMax)}</Text>
          {job.experience ? <Text style={styles.exp}>{job.experience}</Text> : null}
        </View>

        <View style={styles.subFooter}>
          {job.createdAt ? (
            <Text style={styles.subText}>{postedAgo(job.createdAt)}</Text>
          ) : <View />}
          {typeof job.applicantCount === "number" ? (
            <Text style={styles.subText}>
              {job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Memoized so parent re-renders (e.g. search keystrokes on JobList) don't
// re-render every visible card. Saved-state changes are handled inside via the
// SavedJobs context (its value is memoized), so only a card whose own saved
// flag flips will re-render for that reason. Shallow-compare the props that
// actually affect output.
export default memo(JobCard, (prev, next) =>
  prev.job._id === next.job._id &&
  prev.job.applicantCount === next.job.applicantCount &&
  prev.onPress === next.onPress &&
  prev.showSave === next.showSave &&
  prev.index === next.index
);

const makeStyles = (colors, isDark) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow(isDark),
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  logo: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center", marginRight: spacing.md,
  },
  logoText: { color: colors.primary, fontWeight: "800", fontSize: 18 },
  title: { fontSize: 16, fontWeight: "700", color: colors.text },
  company: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  saveBtn: { padding: 2 },
  badgeRow: { flexDirection: "row", marginBottom: spacing.md, gap: spacing.sm },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  easyBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: colors.accentLight, paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.pill,
  },
  easyText: { color: colors.accentDark, fontSize: 11, fontWeight: "700" },
  metaRow: { flexDirection: "row", gap: spacing.lg, marginBottom: spacing.md },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, color: colors.textMuted },
  footer: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md,
  },
  salary: { fontSize: 14, fontWeight: "700", color: colors.primary },
  exp: { fontSize: 12, color: colors.textMuted },
  subFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  subText: { fontSize: 11, color: colors.textLight },
});
