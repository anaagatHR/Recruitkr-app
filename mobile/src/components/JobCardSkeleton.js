import React, { useRef, useEffect, useMemo } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { radius, spacing, shadow } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

// Animated shimmering placeholder shown while jobs load (Indeed/LinkedIn style).
export default function JobCardSkeleton() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });
  const Bar = ({ w, h = 12, mt = 0 }) => (
    <Animated.View style={[styles.bar, { width: w, height: h, marginTop: mt, opacity }]} />
  );

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Animated.View style={[styles.logo, { opacity }]} />
        <View style={{ flex: 1 }}>
          <Bar w="70%" h={14} />
          <Bar w="45%" mt={8} />
        </View>
      </View>
      <Bar w="35%" h={20} mt={14} />
      <Bar w="90%" mt={14} />
      <Bar w="50%" mt={10} />
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow(isDark),
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  logo: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.border },
  bar: { backgroundColor: colors.border, borderRadius: 6 },
});
