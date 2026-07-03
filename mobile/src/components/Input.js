import React, { useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius, spacing } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

export default function Input({ label, style, secureTextEntry, ...props }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // When it's a password field, show an eye button to toggle visibility.
  const isPassword = Boolean(secureTextEntry);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.textLight}
          style={[styles.input, isPassword && styles.inputWithIcon]}
          secureTextEntry={isPassword ? hidden : false}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity
            style={styles.eye}
            onPress={() => setHidden((h) => !h)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: spacing.xs + 2,
  },
  inputRow: { position: "relative", justifyContent: "center" },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  inputWithIcon: { paddingRight: 48 },
  eye: {
    position: "absolute",
    right: spacing.md,
    height: "100%",
    justifyContent: "center",
  },
});
