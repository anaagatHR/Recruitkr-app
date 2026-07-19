import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { STAGES, REJECTED, stageIndex, stageColor, tintBg } from "../utils/applicationStages";

/**
 * Horizontal progress tracker for one application.
 *
 * props:
 *   status   "applied" | "shortlisted" | "interview" | "hired" | "rejected"
 *   compact  hide the per-step labels (used inside dense list cards)
 */
export default function ApplicationTimeline({ status = "applied", compact = false }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const rejected = status === REJECTED.key;
  const current = stageIndex(status);
  const active = stageColor(status, colors);

  return (
    <View>
      <View style={styles.track}>
        {STAGES.map((stage, i) => {
          // When rejected, the pipeline stops at "Applied" and turns red.
          const done = rejected ? i === 0 : i <= current;
          const isCurrent = !rejected && i === current;
          const dotColor = rejected && i === 0 ? colors.danger : done ? active : colors.border;
          const icon = rejected && i === 0 ? REJECTED.icon : stage.icon;

          return (
            <React.Fragment key={stage.key}>
              {i > 0 && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: !rejected && i <= current ? active : colors.border },
                  ]}
                />
              )}
              <View style={styles.step}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: done ? dotColor : colors.surface, borderColor: dotColor },
                    isCurrent && { ...styles.dotCurrent, shadowColor: active },
                  ]}
                >
                  <Ionicons
                    name={done ? icon : stage.icon + "-outline"}
                    size={compact ? 12 : 14}
                    color={done ? colors.white : colors.textLight}
                  />
                </View>
                {!compact && (
                  <Text
                    style={[styles.stepLabel, done && { color: colors.text, fontWeight: "700" }]}
                    numberOfLines={1}
                  >
                    {rejected && i === 0 ? REJECTED.label : stage.label}
                  </Text>
                )}
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {!compact && (
        <View style={[styles.hint, { backgroundColor: tintBg(active, isDark) }]}>
          <Ionicons name="information-circle" size={14} color={active} />
          <Text style={[styles.hintText, { color: active }]}>
            {rejected ? REJECTED.hint : STAGES[current].hint}
          </Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  track: { flexDirection: "row", alignItems: "flex-start", marginTop: spacing.sm },
  step: { alignItems: "center", width: 62 },
  dot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  dotCurrent: {
    shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  connector: { flex: 1, height: 2, marginTop: 13, marginHorizontal: -6 },
  stepLabel: {
    fontSize: 10, fontWeight: "600", color: colors.textLight,
    marginTop: 6, textAlign: "center",
  },
  hint: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  hintText: { fontSize: 12, fontWeight: "600", flex: 1 },
});
