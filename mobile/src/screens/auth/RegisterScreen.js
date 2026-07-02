import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { spacing, radius } from "../../theme/colors";

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { register } = useAuth();
  const [role, setRole] = useState("candidate");
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", companyName: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleRegister() {
    const { name, email, password } = form;
    if (!name || !email || !password) {
      return Alert.alert("Missing details", "Name, email and password are required.");
    }
    if (password.length < 6) {
      return Alert.alert("Weak password", "Password must be at least 6 characters.");
    }
    if (role === "employer" && !form.companyName) {
      return Alert.alert("Missing details", "Please enter your company name.");
    }
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim(), role });
    } catch (e) {
      Alert.alert("Sign up failed", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join RecruitKR today</Text>

          <View style={styles.roleRow}>
            <RoleCard
              icon="person" label="Job Seeker" active={role === "candidate"}
              onPress={() => setRole("candidate")}
              styles={styles} colors={colors}
            />
            <RoleCard
              icon="business" label="Employer" active={role === "employer"}
              onPress={() => setRole("employer")}
              styles={styles} colors={colors}
            />
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <Input label="Full Name" placeholder="Your name" value={form.name} onChangeText={set("name")} />
            {role === "employer" && (
              <Input label="Company Name" placeholder="Your company" value={form.companyName} onChangeText={set("companyName")} />
            )}
            <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={set("email")} />
            <Input label="Phone (optional)" placeholder="+91 ..." keyboardType="phone-pad" value={form.phone} onChangeText={set("phone")} />
            <Input label="Password" placeholder="At least 6 characters" secureTextEntry value={form.password} onChangeText={set("password")} />
            <Button title="Sign Up" onPress={handleRegister} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.link}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleCard({ icon, label, active, onPress, styles, colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.roleCard, active && styles.roleCardActive]}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={26} color={active ? colors.white : colors.primary} />
      <Text style={[styles.roleLabel, active && { color: colors.white }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, flexGrow: 1 },
  back: { marginBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: spacing.xs },
  roleRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  roleCard: {
    flex: 1, alignItems: "center", padding: spacing.lg,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, gap: spacing.sm,
  },
  roleCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleLabel: { fontWeight: "700", color: colors.text },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
  footerText: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: "700" },
});
