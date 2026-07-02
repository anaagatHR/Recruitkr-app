import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../i18n/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { spacing, radius } from "../../theme/colors";

function parseResume(raw) {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    if (o && o.name) return o;
  } catch (e) {
    return { name: "Resume link", uri: raw, legacy: true };
  }
  return null;
}

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const resume = parseResume(user?.resumeUrl);

  function confirmLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  }

  async function openResume() {
    if (!resume) return;
    try {
      if (resume.legacy) {
        Linking.openURL(resume.uri);
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resume.uri);
      } else {
        Linking.openURL(resume.uri);
      }
    } catch (e) {
      Alert.alert("Cannot open", "Could not open the resume file.");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHead}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "?").charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.headline}>{user?.headline || "Add your professional headline"}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("EditProfile")}>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editText}>{t("editProfile")}</Text>
          </TouchableOpacity>
        </View>

        {/* Theme toggle */}
        <TouchableOpacity style={styles.settingRow} onPress={toggleTheme}>
          <View style={styles.infoIcon}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Appearance</Text>
            <Text style={styles.infoValue}>{isDark ? "Dark mode" : "Light mode"}</Text>
          </View>
          <View style={[styles.switch, isDark && styles.switchOn]}>
            <View style={[styles.knob, isDark && styles.knobOn]} />
          </View>
        </TouchableOpacity>


        <InfoRow styles={styles} colors={colors} icon="mail-outline" label="Email" value={user?.email} />
        <InfoRow styles={styles} colors={colors} icon="call-outline" label="Phone" value={user?.phone || "Not added"} />
        <InfoRow styles={styles} colors={colors} icon="location-outline" label="Location" value={user?.location || "Not added"} />
        <InfoRow styles={styles} colors={colors} icon="time-outline" label="Experience" value={user?.experience || "Not added"} />

        {/* Resume row (tappable if present) */}
        <TouchableOpacity
          style={styles.infoRow}
          disabled={!resume}
          onPress={openResume}
        >
          <View style={styles.infoIcon}>
            <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Resume</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{resume ? resume.name : "Not added"}</Text>
          </View>
          {resume ? <Ionicons name="open-outline" size={18} color={colors.primary} /> : null}
        </TouchableOpacity>

        {user?.skills?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Skills</Text>
            <View style={styles.skillWrap}>
              {user.skills.map((s, i) => (
                <View key={i} style={styles.skill}><Text style={styles.skillText}>{s}</Text></View>
              ))}
            </View>
          </View>
        )}

        {user?.about ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.aboutText}>{user.about}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.logout} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>{t("logout")}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>RecruitKR • v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ styles, colors, icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg },
  profileHead: { alignItems: "center", marginBottom: spacing.lg },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.white, fontSize: 36, fontWeight: "800" },
  name: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: spacing.md },
  headline: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  editBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight, borderRadius: radius.pill,
  },
  editText: { color: colors.primary, fontWeight: "700" },
  infoRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  settingRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  infoIcon: {
    width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  infoLabel: { fontSize: 12, color: colors.textMuted },
  infoValue: { fontSize: 15, color: colors.text, fontWeight: "600", marginTop: 1 },
  // theme switch
  switch: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: colors.border,
    justifyContent: "center", padding: 3,
  },
  switchOn: { backgroundColor: colors.primary },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" },
  knobOn: { alignSelf: "flex-end" },
  // lang switch
  langSwitch: {
    backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill,
  },
  langSwitchText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  card: {
    backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.md,
    marginTop: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  skillWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  skill: {
    backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill,
  },
  skillText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  aboutText: { fontSize: 14, color: colors.text, lineHeight: 21 },
  logout: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.danger,
  },
  logoutText: { color: colors.danger, fontWeight: "700", fontSize: 15 },
  version: { textAlign: "center", color: colors.textLight, marginTop: spacing.lg, fontSize: 12 },
});
