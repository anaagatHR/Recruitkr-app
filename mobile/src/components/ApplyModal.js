import React, { useState, useMemo } from "react";
import {
  Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

// "How did you hear about us?" options — kept short and tappable so nobody has to type.
const SOURCES = [
  { key: "WhatsApp", icon: "logo-whatsapp" },
  { key: "Facebook", icon: "logo-facebook" },
  { key: "Instagram", icon: "logo-instagram" },
  { key: "Friend", icon: "people-outline" },
  { key: "Website", icon: "globe-outline" },
  { key: "Other", icon: "ellipsis-horizontal" },
];

/**
 * Simple, hard-to-get-confused apply form. Pre-fills name/email/phone from the
 * user's profile; the candidate just confirms and taps Apply. Collects the
 * reference (how they heard + who referred them).
 */
export default function ApplyModal({ visible, onClose, onSubmit, submitting, user, jobTitle }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [qualification, setQualification] = useState(user?.headline || "");
  const [cover, setCover] = useState("");
  const [source, setSource] = useState("");
  const [refName, setRefName] = useState("");
  const [err, setErr] = useState("");

  // Refill from profile whenever the sheet is (re)opened.
  React.useEffect(() => {
    if (visible) {
      setName(user?.name || "");
      setEmail(user?.email || "");
      setPhone(user?.phone || "");
      setQualification(user?.headline || "");
      setCover("");
      setSource("");
      setRefName("");
      setErr("");
    }
  }, [visible, user]);

  function handleSubmit() {
    if (!name.trim()) return setErr("Please enter your name.");
    if (!phone.trim()) return setErr("Please enter your phone number.");
    if (!/^\+?[0-9\s-]{7,15}$/.test(phone.trim()))
      return setErr("Please enter a valid phone number.");
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim()))
      return setErr("Please enter a valid email (or leave it blank).");
    setErr("");
    onSubmit({
      applicantName: name.trim(),
      applicantEmail: email.trim(),
      applicantPhone: phone.trim(),
      referenceSource: source,
      referenceName: refName.trim(),
      // Extra detail the admin panel asks for; recruitkr-api simply ignores these.
      qualification: qualification.trim(),
      cover: cover.trim(),
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.head}>
              <Text style={styles.title}>Apply</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {jobTitle ? <Text style={styles.sub} numberOfLines={1}>for {jobTitle}</Text> : null}

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
            >
              <Field label="Your name" required styles={styles}>
                <TextInput
                  style={styles.input} value={name} onChangeText={setName}
                  placeholder="Full name" placeholderTextColor={colors.textLight}
                />
              </Field>

              <Field label="Phone number" required styles={styles}>
                <TextInput
                  style={styles.input} value={phone} onChangeText={setPhone}
                  placeholder="e.g. 98765 43210" placeholderTextColor={colors.textLight}
                  keyboardType="phone-pad"
                />
              </Field>

              <Field label="Email" styles={styles}>
                <TextInput
                  style={styles.input} value={email} onChangeText={setEmail}
                  placeholder="you@example.com" placeholderTextColor={colors.textLight}
                  keyboardType="email-address" autoCapitalize="none"
                />
              </Field>

              <Field label="Highest qualification" styles={styles}>
                <TextInput
                  style={styles.input} value={qualification} onChangeText={setQualification}
                  placeholder="e.g. B.Tech Computer Science" placeholderTextColor={colors.textLight}
                />
              </Field>

              <Field label="Cover note (optional)" styles={styles}>
                <TextInput
                  style={[styles.input, styles.inputMultiline]} value={cover} onChangeText={setCover}
                  placeholder="Why you're a good fit for this role"
                  placeholderTextColor={colors.textLight}
                  multiline numberOfLines={3} textAlignVertical="top"
                />
              </Field>

              <Field label="How did you hear about us?" styles={styles}>
                <View style={styles.chipWrap}>
                  {SOURCES.map((s) => {
                    const active = source === s.key;
                    return (
                      <TouchableOpacity
                        key={s.key}
                        onPress={() => setSource(active ? "" : s.key)}
                        style={[styles.chip, active && styles.chipActive]}
                        activeOpacity={0.85}
                      >
                        <Ionicons name={s.icon} size={15} color={active ? colors.white : colors.primary} />
                        <Text style={[styles.chipText, active && { color: colors.white }]}>{s.key}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Field>

              <Field label="Referred by (optional)" styles={styles}>
                <TextInput
                  style={styles.input} value={refName} onChangeText={setRefName}
                  placeholder="Name of who told you (if any)" placeholderTextColor={colors.textLight}
                />
              </Field>

              {err ? (
                <View style={styles.errBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.errText}>{err}</Text>
                </View>
              ) : null}
            </ScrollView>

            <TouchableOpacity
              style={[styles.submit, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.9}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                  <Text style={styles.submitText}>Submit Application</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, required, children, styles }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}{required ? <Text style={styles.req}> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheetWrap: { width: "100%" },
  sheet: {
    backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, maxHeight: "90%",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: "center", marginBottom: spacing.md,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  field: { marginTop: spacing.md },
  label: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: 6 },
  req: { color: colors.danger },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.lg, height: 50,
    fontSize: 15, color: colors.text,
  },
  inputMultiline: { height: 92, paddingTop: spacing.md, paddingBottom: spacing.md },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: spacing.md, paddingVertical: 9, borderRadius: radius.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  errBox: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md,
    backgroundColor: colors.danger + "1A", padding: spacing.md, borderRadius: radius.md,
  },
  errText: { color: colors.danger, fontSize: 13, fontWeight: "600", flex: 1 },
  submit: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    backgroundColor: colors.primary, height: 54, borderRadius: radius.md, marginTop: spacing.lg,
  },
  submitText: { color: colors.white, fontWeight: "800", fontSize: 16 },
});
