import React, { useMemo, useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import JobCard from "../../components/JobCard";
import HeroBackground from "../../components/landing/HeroBackground";
import GradientButton from "../../components/landing/GradientButton";
import Badge from "../../components/landing/Badge";
import QuickFilters from "../../components/landing/QuickFilters";
import SearchCard from "../../components/landing/SearchCard";
import StepTracker from "../../components/landing/StepTracker";
import Footer from "../../components/landing/Footer";
import BackToTop from "../../components/landing/BackToTop";
import { useLang } from "../../i18n/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { cssLoop } from "../../utils/webAnim";
import { spacing, radius, shadow } from "../../theme/colors";
import { jobsApi, companiesApi } from "../../api";

// Defined locally (not imported) so the Marquee never depends on another
// module resolving — Platform.OS is always available from react-native.
const isWeb = Platform.OS === "web";

// Build marker — lets us confirm the browser is running the LATEST bundle
// vs a stale cached one.
console.log("[RecruitKR] welcome build = web-slide-v10 (CSS marquee on web)");

// Mirrors the recruitkr.com landing, mobile-first:
// hero → search → stats → categories (slider) → latest jobs (slider) →
// companies (auto-marquee) → footer. Job/company data is public (no auth);
// tapping anything that needs an account routes to Register.

const CATEGORIES = [
  { key: "corporate", label: "Corporate Jobs", count: "120+", icon: "business" },
  { key: "wfh", label: "Work From Home", count: "80+", icon: "home" },
  { key: "freelance", label: "Freelance", count: "60+", icon: "laptop" },
  { key: "internship", label: "Internship", count: "40+", icon: "school" },
  { key: "gig", label: "Gig / Part-time", count: "40+", icon: "time" },
  { key: "other", label: "Other", count: "40+", icon: "grid" },
];

const STATS = [
  { value: "500+", label: "Active jobs", icon: "briefcase" },
  { value: "200+", label: "Companies", icon: "business" },
  { value: "10K+", label: "Candidates", icon: "people" },
];

/* Auto-sliding row.
   Web and native need DIFFERENT drivers, not one shared path. react-native-web
   ignores `useNativeDriver`, so an Animated.loop here runs on the main JS
   thread via requestAnimationFrame. Three of these marquees looping at once
   starves every touch handler in the app — and because a native-stack keeps
   pushed-under screens mounted, it kept starving the Login/Register screens
   layered on top of this one (button presses simply never ran).
   So: CSS keyframes on web (GPU-composited, off the JS thread), native driver
   on native. Same split HeroBackground and SearchCard already use. */
function Marquee({ children, speed = 40 }) {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (isWeb || reduced || !w) return;
    x.setValue(0);
    const anim = Animated.loop(
      Animated.timing(x, {
        toValue: -w,
        duration: (w / speed) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [w, speed, x, reduced]);

  // The web equivalent: one CSS animation, no per-frame JS work.
  const webStyle =
    isWeb && w && !reduced
      ? cssLoop(
          {
            "0%": { transform: [{ translateX: 0 }] },
            "100%": { transform: [{ translateX: -w }] },
          },
          w / speed
        )
      : null;

  return (
    <View style={{ overflow: "hidden", width: "100%", maxWidth: "100%" }}>
      <Animated.View
        style={[
          { flexDirection: "row", alignSelf: "flex-start" },
          !isWeb && { transform: [{ translateX: x }] },
          webStyle,
        ]}
      >
        <View
          style={{ flexDirection: "row" }}
          // Ignore sub-pixel layout jitter: on web a fractional width can
          // otherwise ping-pong setW -> re-render -> onLayout forever.
          onLayout={(e) => {
            const next = e.nativeEvent.layout.width;
            setW((prev) => (Math.abs(prev - next) > 1 ? next : prev));
          }}
        >
          {children}
        </View>
        <View style={{ flexDirection: "row" }}>{children}</View>
      </Animated.View>
    </View>
  );
}

export default function WelcomeScreen({ navigation }) {
  const { t } = useLang();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hero controls: quick-filter chips + search box filter the Latest jobs list.
  const [quickFilter, setQuickFilter] = useState(null);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  // Hero entrance (fade + slide up), reduce-motion aware.
  const reduced = useReducedMotion();
  const heroIn = useRef(new Animated.Value(0)).current;

  // Back-to-top button visibility, driven by scroll offset.
  const scrollRef = useRef(null);
  const [showTop, setShowTop] = useState(false);
  const scrollToTop = useCallback(
    () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
    []
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [jRes, cRes] = await Promise.all([
          jobsApi.list({ sort: "newest", limit: 12 }),
          companiesApi.list().catch(() => ({ companies: [] })),
        ]);
        if (!alive) return;
        setJobs((jRes?.jobs || []).slice(0, 12));
        setCompanies((cRes?.companies || []).slice(0, 12));
      } catch {
        // Free server may be waking up — landing still looks complete without data.
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (reduced || isWeb) {
      heroIn.setValue(1); // no JS-driven entrance on web
      return;
    }
    Animated.timing(heroIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [reduced, heroIn]);

  // Latest jobs filtered by the active chip + submitted search text.
  const filteredJobs = useMemo(() => {
    const q = submittedQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      const typeOk = !quickFilter || j.jobType === quickFilter;
      const textOk =
        !q ||
        (j.title || "").toLowerCase().includes(q) ||
        (j.company || "").toLowerCase().includes(q) ||
        (j.skills || []).join(" ").toLowerCase().includes(q);
      return typeOk && textOk;
    });
  }, [jobs, quickFilter, submittedQuery]);

  const goRegister = useCallback(() => navigation.navigate("Register"), [navigation]);
  const goLogin = useCallback(() => navigation.navigate("Login"), [navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        scrollEventThrottle={16}
        onScroll={(e) => setShowTop(e.nativeEvent.contentOffset.y > 500)}
      >
        {/* Top bar: logo + theme toggle + login */}
        <View style={styles.topBar}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
          <View style={styles.topRight}>
            <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn} accessibilityLabel="Toggle theme">
              <Ionicons name={isDark ? "sunny" : "moon"} size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={goLogin} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <HeroBackground />
          <Animated.View
            style={{
              zIndex: 1,
              opacity: heroIn,
              transform: [
                { translateY: heroIn.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
              ],
            }}
          >
            <Badge icon="sparkles" label="Explore jobs with confidence" />

            <Text style={styles.heroTitle}>
              Find your{"\n"}
              <Text style={styles.heroTitleAccent}>dream job</Text> today
            </Text>
            <Text style={styles.heroSub}>
              Connect directly with recruiters, track live updates, and apply for verified jobs — all in one place.
            </Text>

            <View style={styles.heroActions}>
              <GradientButton title="Explore jobs" onPress={goRegister} style={{ flex: 1 }} />
              <Button title="Talk to us" variant="outline" onPress={goLogin} style={styles.heroBtn} />
            </View>

            {/* Quick-filter chips (filter the Latest jobs list) */}
            <View style={{ marginTop: spacing.md }}>
              <QuickFilters value={quickFilter} onChange={setQuickFilter} />
            </View>

            {/* Floating search + stat counters */}
            <View style={{ marginTop: spacing.lg }}>
              <SearchCard
                query={query}
                onChangeText={setQuery}
                onSearch={() => setSubmittedQuery(query)}
                stats={[
                  { value: "500+", label: "Jobs" },
                  { value: `${companies.length || 200}+`, label: "Companies" },
                  { value: "24/7", label: "Support" },
                ]}
              />
            </View>

            {/* Journey step tracker */}
            <StepTracker active={0} />
          </Animated.View>
        </View>

        {/* Categories — auto sliding */}
        <Text style={styles.sectionTitle}>Browse by category</Text>
        <View style={{ marginTop: spacing.md }}>
          <Marquee speed={45}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c.key} style={styles.catCard} activeOpacity={0.85} onPress={goRegister}>
                <View style={styles.catIcon}>
                  <Ionicons name={c.icon} size={22} color={colors.primary} />
                </View>
                <Text style={styles.catLabel}>{c.label}</Text>
                <Text style={styles.catCount}>{c.count} jobs</Text>
              </TouchableOpacity>
            ))}
          </Marquee>
        </View>

        {/* Latest jobs — auto sliding, newest first */}
        <View style={styles.rowHeader}>
          <Text style={styles.sectionTitle}>Latest jobs</Text>
          <TouchableOpacity onPress={goRegister}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading fresh jobs…</Text>
          </View>
        ) : filteredJobs.length > 0 ? (
          <View style={{ marginTop: spacing.md }}>
            <Marquee speed={55}>
              {filteredJobs.map((job, i) => (
                <View key={job._id} style={styles.jobSlide}>
                  <JobCard job={job} index={i} showSave={false} onPress={goRegister} flat={isWeb} />
                </View>
              ))}
            </Marquee>
          </View>
        ) : (
          <Text style={styles.noJobs}>No jobs match this filter — try another.</Text>
        )}

        {/* Stats (below latest jobs) */}
        <View style={styles.stats}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon} size={20} color={colors.accent} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Companies working with us — auto marquee */}
        {companies.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Companies working with us</Text>
            <View style={{ marginTop: spacing.md }}>
              <Marquee speed={45}>
                {companies.map((c, i) => (
                  <View key={`${c.name}-${i}`} style={styles.compChip}>
                    <View style={styles.compLogo}>
                      <Text style={styles.compLogoText}>{(c.name || "?").charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.compName} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </View>
                ))}
              </Marquee>
            </View>
          </>
        )}

        {/* Bottom CTA */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Ready to find your dream job?</Text>
          <Text style={styles.ctaSub}>Create a free account and start applying in minutes.</Text>
          <Button title={t("getStarted")} onPress={goRegister} style={{ marginTop: spacing.md }} />
          <TouchableOpacity onPress={goLogin} style={{ marginTop: spacing.md }}>
            <Text style={styles.ctaLogin}>{t("haveAccount")}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Footer onLinkPress={goRegister} />
      </ScrollView>

      {/* Floating back-to-top */}
      <BackToTop visible={showTop} onPress={scrollToTop} />
    </SafeAreaView>
  );
}

const makeStyles = (colors, isDark) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background, overflow: "hidden" },
    scroll: { paddingBottom: 0 },

    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    logo: { width: 150, height: 44 },
    topRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    loginLink: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.primaryLight,
    },
    loginLinkText: { color: colors.primary, fontWeight: "700", fontSize: 14 },

    hero: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      overflow: "hidden",
    },
    heroTitle: {
      color: colors.text,
      fontSize: 38,
      fontWeight: "800",
      lineHeight: 44,
      letterSpacing: -0.5,
      marginTop: spacing.md,
    },
    heroTitleAccent: { color: colors.accent },
    heroSub: { color: colors.textMuted, fontSize: 15, lineHeight: 21, marginTop: spacing.sm },
    heroActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
    heroBtn: { flex: 1 },
    noJobs: {
      color: colors.textMuted,
      fontSize: 14,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
    },

    stats: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.lg,
      alignItems: "center",
      gap: 4,
      ...shadow(isDark),
    },
    statValue: { color: colors.primary, fontSize: 20, fontWeight: "800" },
    statLabel: { color: colors.textMuted, fontSize: 11.5, textAlign: "center" },

    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "800",
      marginTop: spacing.xl,
      marginHorizontal: spacing.lg,
    },
    hList: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingTop: spacing.md },

    catCard: {
      width: 150,
      marginLeft: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      // No shadow on web — this card lives in a moving marquee (see JobCard note).
      ...(isWeb ? null : shadow(isDark)),
    },
    catIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    catLabel: { color: colors.text, fontSize: 15, fontWeight: "700" },
    catCount: { color: colors.accent, fontSize: 12, fontWeight: "700", marginTop: 2 },

    rowHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginRight: spacing.lg,
    },
    seeAll: { color: colors.primary, fontWeight: "700", fontSize: 14, marginTop: spacing.xl },
    jobSlide: { width: 300, marginLeft: spacing.lg },

    loadingBox: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.sm },
    loadingText: { color: colors.textMuted, fontSize: 13 },

    compChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      paddingHorizontal: spacing.lg,
      marginRight: spacing.md,
    },
    compLogo: {
      width: 32,
      height: 32,
      borderRadius: radius.pill,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    compLogoText: { color: colors.primary, fontWeight: "800", fontSize: 15 },
    compName: { color: colors.text, fontWeight: "700", fontSize: 14, maxWidth: 160 },

    ctaCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      margin: spacing.lg,
      marginTop: spacing.xxl,
      padding: spacing.xl,
      alignItems: "center",
      ...shadow(isDark),
    },
    ctaTitle: { color: colors.text, fontSize: 18, fontWeight: "800", textAlign: "center" },
    ctaSub: { color: colors.textMuted, fontSize: 14, textAlign: "center", marginTop: spacing.xs },
    ctaLogin: { color: colors.primary, fontWeight: "700", fontSize: 14 },

    footer: {
      backgroundColor: colors.primaryDark,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xl,
      marginTop: spacing.lg,
    },
    footerLogo: { width: 160, height: 46, marginBottom: spacing.lg, tintColor: "#FFFFFF" },
    footerCol: { marginBottom: spacing.xl },
    footerHeading: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", marginBottom: spacing.md },
    footerLinks: { gap: spacing.sm },
    footerLinkBtn: { paddingVertical: 3 },
    footerLink: { color: "#C7D2E4", fontSize: 14 },
    footerContact: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 4 },
    footerSmall: { color: "#8FA1BE", fontSize: 12, fontWeight: "700", marginTop: spacing.md, marginBottom: 2 },
    footerCopy: {
      color: "#8FA1BE",
      fontSize: 12,
      textAlign: "center",
      marginTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.12)",
      paddingTop: spacing.lg,
    },
  });
