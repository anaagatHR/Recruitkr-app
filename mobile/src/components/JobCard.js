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
  if (!min && !max) return "Not disclosed";
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
        {/* Top: logo + title/company, with a floating bookmark */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
            <Text style={styles.company} numberOfLines={1}>{job.company}</Text>
          </View>
          {showSave && saved ? (
            <TouchableOpacity
              onPress={onToggleSave}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={18}
                color={isSaved ? colors.white : colors.textMuted}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tag row: type + location + category as soft pills */}
        <View style={styles.tagRow}>
          <View style={styles.tagPrimary}>
            <Text style={styles.tagPrimaryText}>{TYPE_LABELS[job.jobType] || job.jobType}</Text>
          </View>
          <View style={styles.tag}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text style={styles.tagText} numberOfLines={1}>{job.location}</Text>
          </View>
          <View style={styles.tag}>
            <Ionicons name="briefcase-outline" size={12} color={colors.textMuted} />
            <Text style={styles.tagText} numberOfLines={1}>{job.category}</Text>
          </View>
        </View>

        {/* Bottom bar: salary pill on the left, meta on the right */}
        <View style={styles.footer}>
          <View style={styles.salaryPill}>
            <Text style={styles.salaryText}>{formatSalary(job.salaryMin, job.salaryMax)}</Text>
          </View>
          <View style={styles.footerMeta}>
            <View style={styles.easyBadge}>
              <Ionicons name="flash" size={11} color={colors.accentDark} />
              <Text style={styles.easyText}>Easy Apply</Text>
            </View>
          </View>
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
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow(isDark),
  },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md },
  logo: {
    width: 52, height: 52, borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center", marginRight: spacing.md,
  },
  logoText: { color: colors.primary, fontWeight: "800", fontSize: 22 },
  title: { fontSize: 16, fontWeight: "800", color: colors.text, lineHeight: 21 },
  company: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  saveBtn: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.border,
  },
  saveBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },

  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  tagPrimary: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tagPrimaryText: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  tag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    maxWidth: "45%",
  },
  tagText: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },

  footer: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md,
  },
  salaryPill: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.md,
  },
  salaryText: { fontSize: 14, fontWeight: "800", color: colors.accentDark },
  footerMeta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  easyBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: colors.accentLight, paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.pill,
  },
  easyText: { color: colors.accentDark, fontSize: 11, fontWeight: "700" },

  subFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  subText: { fontSize: 11, color: colors.textLight },
});
