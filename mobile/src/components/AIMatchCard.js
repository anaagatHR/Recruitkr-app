import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { aiApi } from "../api";

/**
 * Shows a Claude-generated "fit score" for the current candidate vs a job.
 * Fetches lazily on mount. Hides itself entirely if AI is disabled server-side
 * or the request fails, so it never blocks the screen.
 */
export default function AIMatchCard({ jobId, enabled = true }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [state, setState] = useState({ loading: enabled, data: null, hidden: !enabled });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!enabled) return;
    (async () => {
      try {
        const res = await aiApi.match(jobId);
        if (!alive) return;
        if (res.enabled === false) setState({ loading: false, data: null, hidden: true });
        else setState({ loading: false, data: res, hidden: false });
      } catch (e) {
        if (alive) setState({ loading: false, data: null, hidden: true });
      }
    })();
    return () => { alive = false; };
  }, [jobId, enabled]);

  if (state.hidden) return null;

  const scoreColor = (s) =>
    s >= 75 ? colors.success : s >= 50 ? colors.warning : colors.textMuted;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
          <Text style={styles.badgeText}>AI Match</Text>
        </View>
        {state.loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={[styles.score, { color: scoreColor(state.data.score) }]}>
            {state.data.score}%
          </Text>
        )}
      </View>

      {state.loading ? (
        <Text style={styles.analyzing}>Analyzing your fit for this role…</Text>
      ) : (
        <>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${state.data.score}%`, backgroundColor: scoreColor(state.data.score) },
              ]}
            />
          </View>
          <Text style={styles.reason}>{state.data.reason}</Text>

          {(state.data.matchedSkills?.length > 0 || state.data.missingSkills?.length > 0) && (
            <TouchableOpacity onPress={() => setExpanded((v) => !v)} style={styles.toggle}>
              <Text style={styles.toggleText}>{expanded ? "Hide details" : "See skill breakdown"}</Text>
              <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
            </TouchableOpacity>
          )}

          {expanded && (
            <View style={styles.details}>
              {state.data.matchedSkills?.length > 0 && (
                <SkillRow
                  label="You have"
                  items={state.data.matchedSkills}
                  color={colors.success}
                  bg={colors.accentLight}
                  styles={styles}
                />
              )}
              {state.data.missingSkills?.length > 0 && (
                <SkillRow
                  label="Nice to add"
                  items={state.data.missingSkills}
                  color={colors.textMuted}
                  bg={colors.surface}
                  styles={styles}
                />
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

function SkillRow({ label, items, color, bg, styles }) {
  return (
    <View style={{ marginTop: spacing.sm }}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.chipWrap}>
        {items.map((s, i) => (
          <View key={i} style={[styles.chip, { backgroundColor: bg }]}>
            <Text style={[styles.chipText, { color }]}>{s}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginTop: spacing.md, borderWidth: 1, borderColor: colors.primary + "55",
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { flexDirection: "row", alignItems: "center", gap: 5 },
  badgeText: { color: colors.primary, fontWeight: "800", fontSize: 13, letterSpacing: 0.3 },
  score: { fontSize: 22, fontWeight: "900" },
  analyzing: { color: colors.textMuted, fontSize: 13, marginTop: spacing.sm },
  barTrack: {
    height: 8, borderRadius: 4, backgroundColor: colors.border,
    marginTop: spacing.md, overflow: "hidden",
  },
  barFill: { height: 8, borderRadius: 4 },
  reason: { color: colors.text, fontSize: 13, marginTop: spacing.sm, lineHeight: 19 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  toggleText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  details: { marginTop: spacing.xs },
  detailLabel: { fontSize: 12, color: colors.textMuted, fontWeight: "700", marginBottom: 4 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
});
