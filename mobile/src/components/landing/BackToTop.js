import React, { useEffect, useRef, useMemo } from "react";
import { Animated, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { radius, shadow } from "../../theme/colors";
import { tap } from "../../utils/haptics";

const IS_WEB = Platform.OS === "web";

// Floating "scroll to top" button — fades/scales in once `visible` is true.
export default function BackToTop({ visible, onPress }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (IS_WEB) {
      anim.setValue(visible ? 1 : 0); // no JS-driven animation on web
      return;
    }
    Animated.spring(anim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [visible, anim]);

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.wrap,
        { opacity: anim, transform: [{ scale: anim }] },
      ]}
    >
      <Pressable
        onPress={() => { tap(); onPress?.(); }}
        style={styles.btn}
        accessibilityRole="button"
        accessibilityLabel="Back to top"
      >
        <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (colors, isDark) =>
  StyleSheet.create({
    wrap: { position: "absolute", right: 18, bottom: 24 },
    btn: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      ...shadow(isDark),
    },
  });
