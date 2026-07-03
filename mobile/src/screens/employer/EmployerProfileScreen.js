import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Avatar from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../i18n/LanguageContext";
import { authApi } from "../../api";
import { uploadImageAsync, CLOUDINARY_READY } from "../../services/uploadImage";
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
  const [photoBusy, setPhotoBusy] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function changePhoto() {
    if (!CLOUDINARY_READY) {
      Alert.alert("Coming soon", "Photo upload will be enabled shortly.");
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo access to set a logo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.6,
    });
    if (result.canceled) return;
    setPhotoBusy(true);
    try {
      const url = await uploadImageAsync(result.assets[0].uri);
      const { user: updated } = await authApi.updateMe({ photoUrl: url });
      setUser(updated);
    } catch (e) {
      Alert.alert("Upload failed", e.message);
    } finally {
      setPhotoBusy(false);
    }
  }

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
            <TouchableOpacity onPress={changePhoto} activeOpacity={0.85} disabled={photoBusy}>
              <Avatar uri={user?.photoUrl} name={user?.companyName || user?.name} size={88} />
              <View style={styles.camBadge}>
                {photoBusy ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Ionicons name="camera" size={16} color={colors.white} />
                )}
              </View>
            </TouchableOpacity>
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

          <TouchableOpacity style={styles.logout} onPress={confirmLogout} activeOpacity={0.85}>
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out-outline" size={20} color={colors.white} />
            </View>
            <Text style={styles.logoutText}>{t("logout")}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.white} style={{ opacity: 0.9 }} />
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
  camBadge: {
    position: "absolute", right: -2, bottom: -2,
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: colors.background,
  },
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
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    marginTop: spacing.md, padding: spacing.md, paddingRight: spacing.lg,
    borderRadius: radius.md, backgroundColor: colors.danger,
    shadowColor: colors.danger, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  logoutIcon: {
    width: 38, height: 38, borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  logoutText: { color: colors.white, fontWeight: "800", fontSize: 15, flex: 1 },
  version: { textAlign: "center", color: colors.textLight, marginTop: spacing.lg, fontSize: 12 },
});
