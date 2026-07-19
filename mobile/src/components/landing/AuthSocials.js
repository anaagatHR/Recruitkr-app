import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { radius, spacing } from "../../theme/colors";
import { tap } from "../../utils/haptics";

// "or continue with" divider + social login buttons. UI only for now — press
// shows a toast; real OAuth can be wired later.
export default function AuthSocials() {
  const { colors } = useTheme();
  const toast = useToast();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const soon = (name) => {
    tap();
    toast.show(`${name} login coming soon`, { type: "info" });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.social} onPress={() => soon("Google")} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Continue with Google">
          <Ionicons name="logo-google" size={19} color="#EA4335" />
          <Text style={styles.socialText}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.social} onPress={() => soon("LinkedIn")} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Continue with LinkedIn">
          <Ionicons name="logo-linkedin" size={19} color="#0A66C2" />
          <Text style={styles.socialText}>LinkedIn</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    wrap: { marginTop: spacing.xl },
    dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    line: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.textMuted, fontSize: 12.5, fontWeight: "600" },
    row: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
    social: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: 13,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    socialText: { color: colors.text, fontWeight: "700", fontSize: 14 },
  });
