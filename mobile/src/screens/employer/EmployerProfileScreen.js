import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../i18n/LanguageContext";
import { authApi } from "../../api";
import { spacing, radius } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";

export default function EmployerProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const { t } = useLang();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [form, setForm] = useState({
    name: user?.name || "",
    companyName: user?.companyName || "",
    companyWebsite: user?.companyWebsite || "",
    companyAbout: user?.companyAbout || "",
    phone: user?.phone || "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setLoading(true);
    try {
      const { user } = await authApi.updateMe(form);
      setUser(user);
      Alert.alert("Saved", "Company profile updated.");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  function confirmLogout() {
    Alert.alert("Log out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.head}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.companyName || user?.name || "?").charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.company}>{user?.companyName || "Your Company"}</Text>
            <Text style={styles.role}>Employer Account</Text>
          </View>

          <Text style={styles.section}>Company Details</Text>
          <Input label="Your Name" value={form.name} onChangeText={set("name")} />
          <Input label="Company Name" value={form.companyName} onChangeText={set("companyName")} />
          <Input label="Website" placeholder="https://..." autoCapitalize="none" value={form.companyWebsite} onChangeText={set("companyWebsite")} />
          <Input label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={set("phone")} />
          <Input label="About Company" placeholder="Tell candidates about your company" value={form.companyAbout} onChangeText={set("companyAbout")} multiline numberOfLines={4} />

          <Button title={t("save")} onPress={save} loading={loading} />

          <TouchableOpacity style={styles.logout} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>{t("logout")}</Text>
          </TouchableOpacity>
          <Text style={styles.version}>RecruitKR • v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  head: { alignItems: "center", marginBottom: spacing.lg },
  avatar: {
    width: 80, height: 80, borderRadius: radius.lg, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.white, fontSize: 32, fontWeight: "800" },
  company: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: spacing.md },
  role: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  section: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  langRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  langRowText: { flex: 1, color: colors.text, fontWeight: "600" },
  langSwitch: {
    backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill,
  },
  langSwitchText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  logout: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    marginTop: spacing.md, padding: spacing.lg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.danger,
  },
  logoutText: { color: colors.danger, fontWeight: "700", fontSize: 15 },
  version: { textAlign: "center", color: colors.textLight, marginTop: spacing.lg, fontSize: 12 },
});
