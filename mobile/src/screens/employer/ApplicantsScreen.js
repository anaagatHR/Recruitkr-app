import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking, RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Loading, EmptyState, ErrorState, StatusBadge } from "../../components/Common";
import { applicationsApi, aiApi } from "../../api";
import { spacing, radius } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";
import { useAIEnabled } from "../../hooks/useAIEnabled";
import * as haptics from "../../utils/haptics";

const ACTIONS = [
  { status: "shortlisted", label: "Shortlist", icon: "star-outline" },
  { status: "hired", label: "Hire", icon: "checkmark-circle-outline" },
  { status: "rejected", label: "Reject", icon: "close-circle-outline" },
];

export default function ApplicantsScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const aiEnabled = useAIEnabled();
  const { jobId, jobTitle } = route.params;
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [ranking, setRanking] = useState(null); // { [appId]: { score, reason } } once ranked
  const [ranked, setRanked] = useState(false);
  const [rankLoading, setRankLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const { applications } = await applicationsApi.forJob(jobId);
      setApps(applications);
      setError(false);
    } catch (e) {
      setApps([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(appId, status) {
    try {
      await applicationsApi.setStatus(appId, status);
      setApps((prev) => prev.map((a) => (a._id === appId ? { ...a, status } : a)));
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }

  async function rankByAI() {
    haptics.tap();
    setRankLoading(true);
    try {
      const { ranked: rankedList } = await aiApi.rankApplicants(jobId);
      const map = {};
      (rankedList || []).forEach((r) => { map[r.id] = { score: r.score, reason: r.reason }; });
      setRanking(map);
      setRanked(true);
      haptics.success();
    } catch (e) {
      haptics.error();
      Alert.alert("Error", e.message);
    } finally {
      setRankLoading(false);
    }
  }

  // When ranking data is present, sort by score desc; otherwise keep original order.
  const displayApps = useMemo(() => {
    if (!ranking) return apps;
    return [...apps].sort(
      (a, b) => (ranking[b._id]?.score ?? -1) - (ranking[a._id]?.score ?? -1)
    );
  }, [apps, ranking]);

  const scoreColor = (s) =>
    s >= 75 ? colors.success : s >= 50 ? colors.warning : colors.textMuted;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>Applicants</Text>
        <View style={{ width: 24 }} />
      </View>
      <Text style={styles.jobName} numberOfLines={1}>{jobTitle}</Text>

      {aiEnabled && !loading && apps.length > 0 && (
        <TouchableOpacity
          style={[styles.aiBtn, rankLoading && styles.aiBtnDisabled]}
          onPress={rankByAI}
          disabled={rankLoading}
          activeOpacity={0.85}
        >
          {rankLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="sparkles" size={16} color={colors.primary} />
          )}
          <Text style={styles.aiBtnText}>
            {rankLoading ? "Ranking…" : ranked ? "Re-rank by AI fit" : "Rank by AI fit"}
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={displayApps}
          keyExtractor={(a) => a._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const c = item.candidate || {};
            const rank = ranking?.[item._id];
            return (
              <View style={[styles.card, rank && styles.cardRanked]}>
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(c.name || "?").charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{c.name}</Text>
                    <Text style={styles.headline}>{c.headline || "Candidate"}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                {rank && (
                  <View style={styles.aiFit}>
                    <View style={[styles.matchPill, { backgroundColor: scoreColor(rank.score) + "1F", borderColor: scoreColor(rank.score) + "55" }]}>
                      <Ionicons name="sparkles" size={12} color={scoreColor(rank.score)} />
                      <Text style={[styles.matchPillText, { color: scoreColor(rank.score) }]}>{rank.score}% match</Text>
                    </View>
                    {rank.reason ? <Text style={styles.aiReason}>{rank.reason}</Text> : null}
                  </View>
                )}

                <View style={styles.details}>
                  {c.location ? <Detail icon="location-outline" text={c.location} styles={styles} colors={colors} /> : null}
                  {c.experience ? <Detail icon="time-outline" text={c.experience} styles={styles} colors={colors} /> : null}
                  {c.phone ? <Detail icon="call-outline" text={c.phone} styles={styles} colors={colors} /> : null}
                  {c.email ? <Detail icon="mail-outline" text={c.email} styles={styles} colors={colors} /> : null}
                  {(item.resumeUrl || c.resumeUrl) ? (
                    <TouchableOpacity onPress={() => Linking.openURL(item.resumeUrl || c.resumeUrl)}>
                      <Detail icon="document-attach-outline" text="View Resume" link styles={styles} colors={colors} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {c.skills?.length > 0 && (
                  <View style={styles.skillWrap}>
                    {c.skills.map((s, i) => (
                      <View key={i} style={styles.skill}><Text style={styles.skillText}>{s}</Text></View>
                    ))}
                  </View>
                )}

                <View style={styles.actions}>
                  {ACTIONS.map((a) => (
                    <TouchableOpacity
                      key={a.status}
                      onPress={() => updateStatus(item._id, a.status)}
                      style={[styles.actionBtn, item.status === a.status && styles.actionBtnActive]}
                    >
                      <Ionicons
                        name={a.icon} size={16}
                        color={item.status === a.status ? colors.white : colors.primary}
                      />
                      <Text style={[styles.actionText, item.status === a.status && { color: colors.white }]}>
                        {a.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            error ? (
              <ErrorState onRetry={load} />
            ) : (
              <EmptyState icon="people-outline" title="No applicants yet" subtitle="Applicants will appear here once candidates apply." />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

function Detail({ icon, text, link, styles, colors }) {
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={14} color={link ? colors.primary : colors.textMuted} />
      <Text style={[styles.detailText, link && styles.detailLink]}>{text}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  topTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  jobName: { paddingHorizontal: spacing.lg, color: colors.textMuted, marginBottom: spacing.sm },
  list: { padding: spacing.lg, flexGrow: 1 },
  aiBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primary + "55",
    backgroundColor: colors.primary + "12",
  },
  aiBtnDisabled: { opacity: 0.6 },
  aiBtnText: { color: colors.primary, fontWeight: "800", fontSize: 14, letterSpacing: 0.3 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardRanked: { borderColor: colors.primary + "55" },
  aiFit: { marginTop: spacing.md },
  matchPill: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1,
  },
  matchPillText: { fontSize: 12, fontWeight: "800" },
  aiReason: { color: colors.text, fontSize: 13, marginTop: spacing.sm, lineHeight: 19 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontWeight: "800", fontSize: 18 },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  headline: { fontSize: 13, color: colors.textMuted },
  details: { marginTop: spacing.md, gap: 6 },
  detail: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, color: colors.textMuted },
  detailLink: { color: colors.primary, fontWeight: "700", textDecorationLine: "underline" },
  skillWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  skill: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  skillText: { color: colors.primary, fontSize: 12, fontWeight: "600" },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
    paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primary,
  },
  actionBtnActive: { backgroundColor: colors.primary },
  actionText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
});
