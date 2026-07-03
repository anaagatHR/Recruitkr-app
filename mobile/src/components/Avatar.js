import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../context/ThemeContext";

/**
 * Circular avatar: shows the user's photo if `uri` is present, otherwise a
 * colored circle with the first letter of `name`. Cached via expo-image.
 */
export default function Avatar({ uri, name, size = 46, fontSize }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const initial = (name || "?").charAt(0).toUpperCase();
  const dim = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[dim, styles.img]}
        contentFit="cover"
        transition={150}
        cachePolicy="disk"
      />
    );
  }
  return (
    <View style={[dim, styles.fallback]}>
      <Text style={[styles.text, { fontSize: fontSize || size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  img: { backgroundColor: colors.primaryLight },
  fallback: { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  text: { color: colors.white, fontWeight: "800" },
});
