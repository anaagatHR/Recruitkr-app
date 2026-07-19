import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as ImagePicker from "expo-image-picker";
import Avatar from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../i18n/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { authApi } from "../../api";
import { uploadImageAsync, CLOUDINARY_READY } from "../../services/uploadImage";
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
  const { user, setUser, logout } = useAuth();
  const { t } = useLang();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const resume = parseResume(user?.resumeUrl);
  const [photoBusy, setPhotoBusy] = useState(false);

  async function changePhoto() {
    if (!CLOUDINARY_READY) {
      Alert.alert("Coming soon", "Photo upload will be enabled shortly.");
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo access to set a picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
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
          <TouchableOpacity onPress={changePhoto} activeOpacity={0.85} disabled={photoBusy}>
            <Avatar uri={user?.photoUrl} name={user?.name} size={96} />
            <View style={styles.camBadge}>
              {photoBusy ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="camera" size={16} color={colors.white} />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.headline}>{user?.headline || "Add your professional headline"}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("EditProfile")}>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editText}>{t("editProfile")}</Text>
          </TouchableOpacity>
        </View>

        {/* Resume Builder */}
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate("ResumeBuilder")}
          activeOpacity={0.85}
        >
          <View style={styles.infoIcon}>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Resume Builder</Text>
            <Text style={styles.infoValue}>Build, score & download your resume</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </TouchableOpacity>

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

        <TouchableOpacity style={styles.logout} onPress={confirmLogout} activeOpacity={0.85}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={20} color={colors.white} />
          </View>
          <Text style={styles.logoutText}>{t("logout")}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.white} style={{ opacity: 0.9 }} />
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
  camBadge: {
    position: "absolute", right: -2, bottom: -2,
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: colors.background,
  },
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
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    marginTop: spacing.xl, padding: spacing.md, paddingRight: spacing.lg,
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
