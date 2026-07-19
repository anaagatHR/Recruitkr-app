import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { isWeb } from "../../utils/webAnim";

// Gently drifting circular "avatar nodes" behind the hero. Transform+opacity
// only (native driver → off the JS thread, so taps stay responsive), clipped to
// bounds, non-interactive, and static when reduce-motion is on.
//
// Right-side nodes are anchored with `right` (not `left` + width) so they can
// never spill past the viewport edge and cause horizontal overflow.
// Kept intentionally minimal (2 subtle nodes) — fewer moving layers = lighter
// GPU compositing on web. Transform+opacity only, no shadow/blur/filter.
const NODES = [
  { left: "7%", top: 14, size: 38, icon: "person", range: 10, delay: 0 },
  { right: "9%", top: 96, size: 34, icon: "briefcase", range: 12, delay: 700 },
];

function Node({ node, colors, reduced }) {
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Web animates via CSS (see webStyle); native uses the native driver.
    if (isWeb || reduced) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: 1, duration: 2600, delay: node.delay, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [reduced, y, node.delay]);

  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [0, -node.range] });

  return (
    <Animated.View
      style={[
        styles.node,
        {
          ...(node.left != null ? { left: node.left } : { right: node.right }),
          top: node.top,
          width: node.size,
          height: node.size,
          borderRadius: node.size / 2,
          backgroundColor: colors.primaryLight,
          borderColor: colors.border,
          // Static on web (no animation there); native animates translateY.
          ...(isWeb ? null : { transform: [{ translateY }] }),
        },
      ]}
    >
      <Ionicons name={node.icon} size={node.size * 0.42} color={colors.primary} />
    </Animated.View>
  );
}

export default function HeroBackground() {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const nodes = useMemo(() => NODES, []);

  return (
    <View style={styles.wrap}>
      {nodes.map((n, i) => (
        <Node key={i} node={n} colors={colors} reduced={reduced} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // pointerEvents in style (not prop) — the prop form is deprecated on web.
  wrap: { ...StyleSheet.absoluteFillObject, overflow: "hidden", pointerEvents: "none" },
  node: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    opacity: 0.5,
  },
});
