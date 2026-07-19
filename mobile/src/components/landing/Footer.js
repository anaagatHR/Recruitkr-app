import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { radius, spacing } from "../../theme/colors";
import { tap } from "../../utils/haptics";

const LINK_GROUPS = {
  Company: ["Home", "About Us", "Goal", "Team", "Success Stories", "Blog", "Admin"],
  Explore: ["Browse Jobs", "For Candidates", "For Employers", "Partners", "Internship", "FAQs"],
  Services: ["Assessment", "Training", "Contact", "Careers"],
};

const SOCIALS = [
  { icon: "logo-linkedin", label: "LinkedIn", url: "https://www.linkedin.com" },
  { icon: "logo-instagram", label: "Instagram", url: "https://www.instagram.com" },
  { icon: "logo-twitter", label: "X (Twitter)", url: "https://twitter.com" },
  { icon: "logo-facebook", label: "Facebook", url: "https://www.facebook.com" },
];

// Premium multi-column footer: brand + socials, newsletter, link grid,
// clickable contacts, divider, and a bottom legal bar.
export default function Footer({ onLinkPress }) {
  const { colors } = useTheme();
  const toast = useToast();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState("");

  const openUrl = useCallback((u) => Linking.openURL(u).catch(() => {}), []);
  const openMail = useCallback((e) => Linking.openURL(`mailto:${e}`).catch(() => {}), []);
  const openTel = useCallback((p) => Linking.openURL(`tel:${p.replace(/\s/g, "")}`).catch(() => {}), []);

  const subscribe = useCallback(() => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    tap();
    if (!ok) {
      toast.show("Enter a valid email", { type: "error" });
      return;
    }
    toast.show("Subscribed to job alerts ✓", { type: "success" });
    setEmail("");
  }, [email, toast]);

  return (
    <View style={styles.footer}>
      {/* Brand + socials */}
      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
        tintColor="#FFFFFF"
        resizeMode="contain"
        accessibilityLabel="RecruitKR logo"
      />
      <Text style={styles.tagline}>Explore jobs with confidence.</Text>
      <Text style={styles.desc}>
        Connect directly with recruiters, track live updates, and apply for verified jobs across India.
      </Text>

      <View style={styles.socials}>
        {SOCIALS.map((s) => (
          <TouchableOpacity
            key={s.label}
            onPress={() => openUrl(s.url)}
            style={styles.socialBtn}
            accessibilityRole="link"
            accessibilityLabel={s.label}
          >
            <Ionicons name={s.icon} size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Newsletter */}
      <View style={styles.newsletter}>
        <Text style={styles.newsHeading}>Subscribe to job alerts</Text>
        <View style={styles.newsRow}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Your email"
            placeholderTextColor="#8FA1BE"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.newsInput}
            returnKeyType="send"
            onSubmitEditing={subscribe}
          />
          <TouchableOpacity onPress={subscribe} accessibilityRole="button" accessibilityLabel="Subscribe">
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.newsBtn}
            >
              <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Link groups — 2-column grid */}
      <View style={styles.grid}>
        {Object.entries(LINK_GROUPS).map(([heading, links]) => (
          <View key={heading} style={styles.col}>
            <Text style={styles.colHeading}>{heading}</Text>
            {links.map((l) => (
              <TouchableOpacity key={l} onPress={onLinkPress} style={styles.linkBtn}>
                <Text style={styles.link}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Contact column (clickable mail/tel) */}
        <View style={styles.col}>
          <Text style={styles.colHeading}>Contact</Text>
          <TouchableOpacity onPress={() => openMail("Careers@recruitkr.com")} style={styles.contactRow}>
            <Ionicons name="mail" size={14} color={colors.accent} />
            <Text style={styles.link}>Careers@recruitkr.com</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openMail("Connect@recruitkr.com")} style={styles.contactRow}>
            <Ionicons name="mail" size={14} color={colors.accent} />
            <Text style={styles.link}>Connect@recruitkr.com</Text>
          </TouchableOpacity>
          <Text style={styles.smallLabel}>Recruiters / Employers</Text>
          <TouchableOpacity onPress={() => openTel("+91 90019 65072")} style={styles.contactRow}>
            <Ionicons name="call" size={14} color={colors.accent} />
            <Text style={styles.link}>+91 90019 65072</Text>
          </TouchableOpacity>
          <Text style={styles.smallLabel}>Candidates / Job Seekers</Text>
          <TouchableOpacity onPress={() => openTel("+91 96363 15150")} style={styles.contactRow}>
            <Ionicons name="call" size={14} color={colors.accent} />
            <Text style={styles.link}>+91 96363 15150</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider + bottom legal bar */}
      <View style={styles.divider} />
      <View style={styles.bottomBar}>
        <Text style={styles.copy}>© 2026 RecruitKR</Text>
        <View style={styles.legal}>
          <TouchableOpacity onPress={onLinkPress}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>•</Text>
          <TouchableOpacity onPress={onLinkPress}>
            <Text style={styles.legalLink}>Terms</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    footer: {
      backgroundColor: colors.primaryDark,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xl,
      marginTop: spacing.lg,
    },
    logo: { width: 160, height: 46, marginBottom: spacing.md },
    tagline: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
    desc: { color: "#C7D2E4", fontSize: 13, lineHeight: 19, marginTop: 6 },

    socials: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
    socialBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },

    newsletter: { marginTop: spacing.xl },
    newsHeading: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", marginBottom: spacing.sm },
    newsRow: { flexDirection: "row", gap: spacing.sm },
    newsInput: {
      flex: 1,
      height: 46,
      backgroundColor: "rgba(255,255,255,0.10)",
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      color: "#FFFFFF",
      fontSize: 14,
    },
    newsBtn: {
      width: 46,
      height: 46,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },

    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: spacing.xxl,
    },
    col: { width: "47%", marginBottom: spacing.xl },
    colHeading: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", marginBottom: spacing.sm },
    linkBtn: { paddingVertical: 4 },
    link: { color: "#C7D2E4", fontSize: 13.5 },
    contactRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
    smallLabel: { color: "#8FA1BE", fontSize: 11.5, fontWeight: "700", marginTop: spacing.sm, marginBottom: 2 },

    divider: { height: 1, backgroundColor: "rgba(255,255,255,0.12)", marginTop: spacing.sm },
    bottomBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.lg,
    },
    copy: { color: "#8FA1BE", fontSize: 12 },
    legal: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    legalLink: { color: "#C7D2E4", fontSize: 12, fontWeight: "600" },
    legalDot: { color: "#5E6E8C", fontSize: 12 },
  });
