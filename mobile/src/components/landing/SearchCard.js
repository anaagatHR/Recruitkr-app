import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { radius, spacing, shadow } from "../../theme/colors";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { isWeb } from "../../utils/webAnim";
import { tap } from "../../utils/haptics";

// Floating glass-style search widget: input + gradient search button + 3 mini
// stat counters. Gently floats up/down (reduce-motion aware).
export default function SearchCard({ query, onChangeText, onSearch, stats = [] }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const reduced = useReducedMotion();
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Web animates via CSS (see webStyle); native uses the native driver.
    if (isWeb || reduced) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [reduced, float]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  // On web we don't float the card (a moving shadowed card repaints every frame).
  return (
    <Animated.View style={[styles.card, !isWeb && { transform: [{ translateY }] }]}>
      <View style={styles.searchRow}>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={onChangeText}
            placeholder="Search jobs, skills…"
            placeholderTextColor={colors.textLight}
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={onSearch}
          />
        </View>
        <Pressable onPress={() => { tap(); onSearch?.(); }} accessibilityRole="button" accessibilityLabel="Search">
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchBtn}
          >
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>

      {stats.length > 0 && (
        <View style={styles.stats}>
          {stats.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const makeStyles = (colors, isDark) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDark ? "rgba(26,35,48,0.85)" : "rgba(255,255,255,0.9)",
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      // No shadow on web (card floats there → per-frame GPU repaint of shadow).
      ...(isWeb ? null : shadow(isDark)),
    },
    searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    inputWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.background,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      height: 48,
    },
    input: { flex: 1, color: colors.text, fontSize: 14, padding: 0 },
    searchBtn: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    stats: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    stat: { alignItems: "center", flex: 1 },
    statValue: { color: colors.primary, fontSize: 17, fontWeight: "800" },
    statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
    divider: { width: 1, height: 26, backgroundColor: colors.border },
  });
