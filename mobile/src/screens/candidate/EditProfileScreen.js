import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
  Modal, TextInput, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Dropdown from "../../components/Dropdown";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { authApi, aiApi } from "../../api";
import { useAIEnabled } from "../../hooks/useAIEnabled";
import * as haptics from "../../utils/haptics";
import { INDIAN_CITIES } from "../../constants/cities";
import { spacing, radius } from "../../theme/colors";

// resumeUrl is stored as a JSON string {name,uri,size}; parse safely.
function parseResume(raw) {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    if (o && o.name) return o;
  } catch (e) {
    // legacy plain URL string
    return { name: "Resume link", uri: raw, legacy: true };
  }
  return null;
}

export default function EditProfileScreen({ navigation }) {
  const { user, setUser } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const aiEnabled = useAIEnabled();

  const [aiModal, setAiModal] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [parsing, setParsing] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    headline: user?.headline || "",
    phone: user?.phone || "",
    location: user?.location || "",
    experience: user?.experience || "",
    skills: (user?.skills || []).join(", "),
    resumeUrl: user?.resumeUrl || "",
    about: user?.about || "",
  });
  const [resumeFile, setResumeFile] = useState(parseResume(user?.resumeUrl));
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function pickResume() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const file = res.assets?.[0];
      if (!file) return;
      const info = { name: file.name, uri: file.uri, size: file.size };
      setResumeFile(info);
      setForm((f) => ({ ...f, resumeUrl: JSON.stringify(info) }));
    } catch (e) {
      Alert.alert("Could not pick file", e.message);
    }
  }

  function removeResume() {
    setResumeFile(null);
    setForm((f) => ({ ...f, resumeUrl: "" }));
  }

  async function autoFillFromResume() {
    if (resumeText.trim().length < 30) {
      Alert.alert("Paste more text", "Add at least a few lines of your resume so AI can read it.");
      return;
    }
    haptics.tap();
    setParsing(true);
    try {
      const { profile } = await aiApi.parseResume(resumeText.trim());
      setForm((f) => ({
        ...f,
        headline: profile.headline || f.headline,
        // skills is edited as a comma-separated string in this form
        skills: profile.skills?.length ? profile.skills.join(", ") : f.skills,
        experience: profile.experience || f.experience,
        location: profile.location || f.location,
        about: profile.about || f.about,
      }));
      haptics.success();
      setAiModal(false);
      setResumeText("");
      Alert.alert("Profile filled ✨", "Review and save.");
    } catch (e) {
      haptics.error();
      Alert.alert("Error", e.message);
    } finally {
      setParsing(false);
    }
  }

  async function save() {
    setLoading(true);
    try {
      const payload = {
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const { user } = await authApi.updateMe(payload);
      setUser(user);
      Alert.alert("Saved", "Your profile has been updated.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {aiEnabled && (
            <TouchableOpacity
              style={styles.aiBtn}
              onPress={() => { haptics.tap(); setAiModal(true); }}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={styles.aiBtnText}>Auto-fill from resume</Text>
            </TouchableOpacity>
          )}

          <Input label="Full Name" value={form.name} onChangeText={set("name")} />
          <Input label="Headline" placeholder="e.g. Frontend Developer" value={form.headline} onChangeText={set("headline")} />
          <Input label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={set("phone")} />

          <Dropdown
            label="Location"
            value={form.location}
            onValueChange={set("location")}
            items={INDIAN_CITIES}
            searchable
            placeholder="Select a city"
          />

          <Input label="Experience" placeholder="e.g. 2 years" value={form.experience} onChangeText={set("experience")} />
          <Input label="Skills (comma separated)" placeholder="React, Node, SQL" value={form.skills} onChangeText={set("skills")} />

          {/* Resume file upload */}
          <Text style={styles.label}>Resume</Text>
          {resumeFile ? (
            <View style={styles.resumeCard}>
              <Ionicons name="document-text" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resumeName} numberOfLines={1}>{resumeFile.name}</Text>
                {resumeFile.size ? (
                  <Text style={styles.resumeSize}>{(resumeFile.size / 1024).toFixed(0)} KB</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={pickResume} style={styles.resumeAction}>
                <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={removeResume} style={styles.resumeAction}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBtn} onPress={pickResume}>
              <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
              <Text style={styles.uploadText}>Upload Resume (PDF / DOC)</Text>
            </TouchableOpacity>
          )}

          <Input
            label="About"
            placeholder="A short summary about you"
            value={form.about}
            onChangeText={set("about")}
            multiline
            numberOfLines={4}
            style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}
          />
          <Button title="Save Changes" onPress={save} loading={loading} />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={aiModal} transparent animationType="slide" onRequestClose={() => setAiModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <View style={styles.badge}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <Text style={styles.badgeText}>Auto-fill from resume</Text>
              </View>
              <TouchableOpacity onPress={() => setAiModal(false)} disabled={parsing}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>
              Paste your resume text below and AI will fill in your profile. Review before saving.
            </Text>
            <TextInput
              style={styles.resumeInput}
              placeholder="Paste your resume text here…"
              placeholderTextColor={colors.textLight}
              value={resumeText}
              onChangeText={setResumeText}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.modalBtn, parsing && styles.aiBtnDisabled]}
              onPress={autoFillFromResume}
              disabled={parsing}
              activeOpacity={0.85}
            >
              {parsing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="sparkles" size={16} color={colors.white} />
              )}
              <Text style={styles.modalBtnText}>{parsing ? "Reading resume…" : "Auto-fill"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  topTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  scroll: { padding: spacing.lg },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: spacing.xs + 2 },
  uploadBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: "dashed",
    borderRadius: radius.md, paddingVertical: 16, marginBottom: spacing.sm,
  },
  uploadText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  resumeCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  resumeName: { fontSize: 14, fontWeight: "600", color: colors.text },
  resumeSize: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  resumeAction: { padding: 4 },
  aiBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primary + "55",
    backgroundColor: colors.primary + "12", marginBottom: spacing.lg,
  },
  aiBtnDisabled: { opacity: 0.6 },
  aiBtnText: { color: colors.primary, fontWeight: "800", fontSize: 14, letterSpacing: 0.3 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  modalCard: {
    backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xl,
  },
  modalHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { flexDirection: "row", alignItems: "center", gap: 6 },
  badgeText: { color: colors.primary, fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },
  modalHint: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  resumeInput: {
    minHeight: 160, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md,
    color: colors.text, fontSize: 14, lineHeight: 20,
  },
  modalBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 14, marginTop: spacing.lg,
  },
  modalBtnText: { color: colors.white, fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },
});
