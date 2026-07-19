import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Loading, EmptyState, ErrorState, StatusBadge } from "../../components/Common";
import ApplicationTimeline from "../../components/ApplicationTimeline";
import RecommendedRail from "../../components/RecommendedRail";
import { applicationsApi, jobsApi } from "../../api";
import { getRecommendations } from "../../utils/recommend";
import { STAGES, REJECTED, stageColor, tintBg } from "../../utils/applicationStages";
import { spacing, radius } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import * as haptics from "../../utils/haptics";

// Android needs this opt-in for the expand/collapse animation on the cards.
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTERS = [
  { key: "all", label: "All" },
  ...STAGES.map((s) => ({ key: s.key, label: s.label })),
  { key: REJECTED.key, label: REJECTED.label },
];

export default function MyApplicationsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [apps, setApps] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { applications } = await applicationsApi.mine();
      setApps(applications);
      setError(false);

      // Recommendations are a nice-to-have — never let them fail the screen.
      try {
        const { jobs } = await jobsApi.list({ limit: 60 });
        setRecommended(
          await getRecommendations({ user, jobs: jobs || [], applications, limit: 8 })
        );
      } catch (e) { /* leave the rail hidden */ }
    } catch (e) {
      setApps([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  // Per-stage counts drive both the summary tiles and the filter chip badges.
  const counts = useMemo(() => {
    const c = { all: apps.length };
    FILTERS.forEach((f) => { if (f.key !== "all") c[f.key] = 0; });
    apps.forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [apps]);

  const visible = useMemo(
    () => (filter === "all" ? apps : apps.filter((a) => a.status === filter)),
    [apps, filter]
  );

  const inProgress = counts.shortlisted + counts.interview;

  function toggle(id) {
    haptics.tap();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => (prev === id ? null : id));
  }

  function openJob(jobId) {
    if (jobId) navigation.navigate("Jobs", { screen: "JobDetail", params: { jobId } });
  }

  const Header = (
    <View>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Applications</Text>
          <Text style={styles.headerSub}>Track every role you've applied to</Text>
        </View>
        <TouchableOpacity
          style={styles.resumeBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Account", { screen: "ResumeBuilder" })}
        >
          <Ionicons name="document-text" size={16} color={colors.primary} />
          <Text style={styles.resumeBtnText}>Resume</Text>
        </TouchableOpacity>
      </View>

      {/* Summary tiles */}
      <View style={styles.stats}>
        <Stat styles={styles} colors={colors} value={counts.all} label="Applied" tone={colors.info} icon="paper-plane" />
        <Stat styles={styles} colors={colors} value={inProgress} label="In progress" tone={colors.warning} icon="trending-up" />
        <Stat styles={styles} colors={colors} value={counts.hired} label="Hired" tone={colors.success} icon="trophy" />
      </View>

      {/* Stage filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => { haptics.tap(); setFilter(f.key); }}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label} {counts[f.key] ? `(${counts[f.key]})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const Footer =
    recommended.length > 0 ? (
      <RecommendedRail
        jobs={recommended}
        subtitle="Based on your skills, location and past applications"
        onPress={(job) => openJob(job._id)}
      />
    ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {loading ? (
        <Loading text="Loading your applications..." />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(a) => a._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={Header}
          ListFooterComponent={Footer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const jobId = item.job?._id || item.job;
            const isOpen = expanded === item._id;
            const accent = stageColor(item.status, colors);
            return (
              <TouchableOpacity
                style={[styles.card, { borderLeftColor: accent }]}
                activeOpacity={0.9}
                onPress={() => toggle(item._id)}
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle} numberOfLines={2}>
                      {item.job?.title || "Job removed"}
                    </Text>
                    <Text style={styles.company} numberOfLines={1}>{item.job?.company}</Text>
                  </View>
                  <StatusBadge status={item.status} withIcon />
                </View>

                <View style={styles.meta}>
                  <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.job?.location || "-"}</Text>
                  <Ionicons name="calendar-outline" size={14} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
                  <Text style={styles.metaText}>
                    Applied {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <ApplicationTimeline status={item.status} compact={!isOpen} />

                {isOpen && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      disabled={!jobId}
                      onPress={() => openJob(jobId)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="open-outline" size={16} color={colors.white} />
                      <Text style={styles.viewBtnText}>View job</Text>
                    </TouchableOpacity>
                    <View style={[styles.updated, { backgroundColor: tintBg(accent, isDark) }]}>
                      <Text style={[styles.updatedText, { color: accent }]}>
                        Updated {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.expandHint}>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.textLight}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            error ? (
              <ErrorState onRetry={() => { setLoading(true); load(); }} />
            ) : (
              <View style={styles.empty}>
                <EmptyState
                  icon="document-text-outline"
                  title={filter === "all" ? "No applications yet" : `No ${filter} applications`}
                  subtitle={
                    filter === "all"
                      ? "Apply to jobs and track their status here."
                      : "Try another stage filter."
                  }
                />
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

function Stat({ styles, colors, value, label, tone, icon }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: tone + "1A" }]}>
        <Ionicons name={icon} size={16} color={tone} />
      </View>
      <Text style={styles.statValue}>{value || 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl, flexGrow: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  resumeBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.primaryLight, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  resumeBtnText: { color: colors.primary, fontWeight: "700", fontSize: 13 },

  stats: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  stat: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: "flex-start",
  },
  statIcon: {
    width: 30, height: 30, borderRadius: radius.sm,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.sm,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600", marginTop: 1 },

  chips: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: colors.white },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, marginHorizontal: spacing.lg,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4,
  },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  jobTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  company: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.md },
  metaText: { fontSize: 12, color: colors.textMuted },

  actions: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  viewBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
  },
  viewBtnText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  updated: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm },
  updatedText: { fontSize: 11, fontWeight: "700" },

  expandHint: { alignItems: "center", marginTop: spacing.sm, marginBottom: -spacing.sm },
  empty: { paddingVertical: spacing.xxl },
});
