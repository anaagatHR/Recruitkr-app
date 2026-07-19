import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  KeyboardAvoidingView, Platform, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Button from "../../components/Button";
import AuthSocials from "../../components/landing/AuthSocials";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { isWeb } from "../../utils/webAnim";
import { spacing } from "../../theme/colors";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Entrance fade + slide (reduce-motion aware).
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // No native animated module on web — jump straight to the end state rather
    // than running the entrance on the JS thread.
    if (reduced || isWeb) { anim.setValue(1); return; }
    Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [reduced, anim]);

  const validate = useCallback(() => {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [email, password]);

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Navigation switches automatically via auth state.
    } catch (err) {
      toast.show(err.message || "Login failed", { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const forgot = () => toast.show("Password reset coming soon", { type: "info" });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Animated.View
            style={{
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
            }}
          >
            {/* Header */}
            <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="RecruitKR" />
            <Text style={styles.title}>Welcome back 👋</Text>
            <Text style={styles.subtitle}>Log in to continue your job search</Text>

            {/* Card */}
            <View style={styles.card}>
              <Input
                label="Email"
                icon="mail-outline"
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(v) => { setEmail(v); if (errors.email) setErrors((e) => ({ ...e, email: null })); }}
                error={errors.email}
              />
              <Input
                label="Password"
                icon="lock-closed-outline"
                placeholder="Your password"
                secureTextEntry
                value={password}
                onChangeText={(v) => { setPassword(v); if (errors.password) setErrors((e) => ({ ...e, password: null })); }}
                error={errors.password}
              />
              <TouchableOpacity onPress={forgot} style={styles.forgot}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <Button title="Log In" onPress={handleLogin} loading={loading} />

              <AuthSocials />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.link}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, flexGrow: 1 },
  back: { marginBottom: spacing.md },
  logo: { width: 160, height: 46, marginBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  forgot: { alignSelf: "flex-end", marginBottom: spacing.lg, marginTop: -spacing.sm },
  forgotText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
  footerText: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: "700" },
});
