import React, { useRef, useEffect, useMemo, useCallback, memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius, spacing, shadow } from "../theme/colors";

const IS_WEB = Platform.OS === "web";
import { useSavedJobs } from "../context/SavedJobsContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { postedAgo } from "../utils/time";
import { tap } from "../utils/haptics";

const TYPE_LABELS = {
  "full-time": "Full time",
  "part-time": "Part time",
  remote: "Remote",
  internship: "Internship",
  freelance: "Freelance",
  gig: "Gig",
};

// Envato-style salary: compact monthly figure like "₹1.2L/mo" / "₹35K/mo".
function formatSalary(min, max) {
  if (!min && !max) return null;
  const f = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${Math.round(n / 1000)}K`);
  const val = min && max ? max : min || max;
  return `₹${f(val)}/mo`;
}

function JobCard({ job, onPress, showSave = true, index = 0, flat = false }) {
  const initial = (job.company || "?").charAt(0).toUpperCase();
  const saved = useSavedJobs();
  const isSaved = saved?.isSaved(job._id);
  const toast = useToast();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark, flat), [colors, isDark, flat]);
  const salary = formatSalary(job.salaryMin, job.salaryMax);

  // Staggered entrance: fade + slide up, driven off mount only.
  // Skipped on web (JS-driven Animated there → warnings + main-thread work).
  const anim = useRef(new Animated.Value(IS_WEB ? 1 : 0)).current;
  useEffect(() => {
    if (IS_WEB) return;
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay: Math.min(index, 8) * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  // Press scale feedback — skipped on web for the same reason as the entrance.
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = useCallback(() => {
    if (IS_WEB) return;
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  }, []);
  const pressOut = useCallback(() => {
    if (IS_WEB) return;
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, []);
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
        {/* Row 1: logo + title/company on the left, bookmark + salary on the right */}
        <View style={styles.topRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{initial}</Text>
          </View>
          <View style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
            <Text style={styles.company} numberOfLines={1}>{job.company}</Text>
          </View>
          <View style={styles.rightCol}>
            {showSave && saved ? (
              <TouchableOpacity
                onPress={onToggleSave}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={20}
                  color={isSaved ? colors.accent : colors.textLight}
                />
              </TouchableOpacity>
            ) : null}
            {salary ? <Text style={styles.salary}>{salary}</Text> : null}
          </View>
        </View>

        {/* Row 2: location · type · category — light meta line */}
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{job.location}</Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{TYPE_LABELS[job.jobType] || job.jobType}</Text>
          </View>
        </View>

        {/* Row 3: category chip + easy-apply + posted/applicants */}
        <View style={styles.footer}>
          <View style={styles.chipsRow}>
            <View style={styles.catChip}>
              <Text style={styles.catChipText} numberOfLines={1}>{job.category}</Text>
            </View>
            <View style={styles.easyChip}>
              <Ionicons name="flash" size={11} color={colors.accentDark} />
              <Text style={styles.easyText}>Easy Apply</Text>
            </View>
          </View>
          <Text style={styles.posted}>
            {job.createdAt ? postedAgo(job.createdAt) : ""}
          </Text>
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
  prev.index === next.index &&
  prev.flat === next.flat
);

const makeStyles = (colors, isDark, flat) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    // Shadow skipped when `flat` (e.g. inside a moving marquee on web, where a
    // moving box-shadow forces per-frame GPU repaints).
    ...(flat ? null : shadow(isDark)),
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  logo: {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center", marginRight: spacing.md,
  },
  logoText: { color: colors.primary, fontWeight: "800", fontSize: 20 },
  titleWrap: { flex: 1, paddingRight: spacing.sm },
  title: { fontSize: 16, fontWeight: "800", color: colors.text },
  company: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  rightCol: { alignItems: "flex-end", gap: spacing.sm },
  salary: { fontSize: 14, fontWeight: "800", color: colors.accentDark },

  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  metaText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textLight },

  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: spacing.md, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  chipsRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  catChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill,
    maxWidth: "55%",
  },
  catChipText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  easyChip: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: colors.accentLight, paddingHorizontal: spacing.md, paddingVertical: 5,
    borderRadius: radius.pill,
  },
  easyText: { color: colors.accentDark, fontSize: 11, fontWeight: "700" },
  posted: { fontSize: 11, color: colors.textLight, marginLeft: spacing.sm },
});
