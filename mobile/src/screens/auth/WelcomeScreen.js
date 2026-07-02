import React, { useMemo, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import { useLang } from "../../i18n/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { spacing, radius } from "../../theme/colors";

export default function WelcomeScreen({ navigation }) {
  const { t } = useLang();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Logo fade + scale-in, then features slide up
  const logoAnim = useRef(new Animated.Value(0)).current;
  const featAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(featAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Animated.Image
          source={require("../../assets/logo.png")}
          style={[
            styles.logo,
            {
              opacity: logoAnim,
              transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
            },
          ]}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.tagline, { opacity: logoAnim }]}>{t("tagline")}</Animated.Text>

        <Animated.View
          style={[
            styles.features,
            { opacity: featAnim, transform: [{ translateY: featAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}
        >
          <Feature icon="search" text="500+ active job openings" styles={styles} colors={colors} />
          <Feature icon="rocket" text={t("applyNow")} styles={styles} colors={colors} />
          <Feature icon="notifications" text="Instant updates & tracking" styles={styles} colors={colors} />
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <Button title={t("getStarted")} onPress={() => navigation.navigate("Register")} />
        <Button
          title={t("haveAccount")}
          variant="outline"
          style={{ marginTop: spacing.md }}
          onPress={() => navigation.navigate("Login")}
        />
      </View>
    </SafeAreaView>
  );
}

function Feature({ icon, text, styles, colors }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  langToggle: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end",
    margin: spacing.lg, paddingHorizontal: spacing.md, paddingVertical: 6,
    backgroundColor: colors.primaryLight, borderRadius: radius.pill,
  },
  langToggleText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, paddingTop: 0 },
  logo: { width: 240, height: 103, marginBottom: spacing.md, alignSelf: "center" },
  tagline: { fontSize: 16, color: colors.textMuted, marginBottom: spacing.xxl },
  features: { gap: spacing.md, alignSelf: "stretch", marginTop: spacing.lg },
  feature: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.background, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  featureIcon: {
    width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  featureText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  actions: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
