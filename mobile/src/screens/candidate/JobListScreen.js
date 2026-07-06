import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, Image, ScrollView, Animated, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import JobCard from "../../components/JobCard";
import JobCardSkeleton from "../../components/JobCardSkeleton";
import FilterSheet from "../../components/FilterSheet";
import { Loading, EmptyState } from "../../components/Common";
import { jobsApi, aiApi } from "../../api";
import { useAIEnabled } from "../../hooks/useAIEnabled";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../i18n/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationsContext";
import { useRecentlyViewed } from "../../context/RecentlyViewedContext";
import { useJobAlerts } from "../../context/JobAlertsContext";
import { spacing, radius, shadow } from "../../theme/colors";

const keyExtractor = (item) => item._id;

const CATEGORIES = ["All", "IT", "Healthcare", "Banking", "Retail", "Manufacturing", "Logistics"];

const QUICK_FILTERS = [
  { key: "remote", label: "Remote", icon: "home-outline" },
  { key: "internship", label: "Internship", icon: "school-outline" },
  { key: "freelance", label: "Freelance", icon: "laptop-outline" },
  { key: "part-time", label: "Part-time", icon: "time-outline" },
];

const CATEGORY_CARDS = [
  { title: "Corporate Jobs", desc: "Office roles & full-time", icon: "business-outline", filter: { jobType: "full-time" } },
  { title: "Work From Home", desc: "Remote opportunities", icon: "home-outline", filter: { jobType: "remote" } },
  { title: "Freelance", desc: "Project-based work", icon: "laptop-outline", filter: { jobType: "freelance" } },
  { title: "Internship", desc: "Learn & earn", icon: "school-outline", filter: { jobType: "internship" } },
  { title: "Gig / Part-time", desc: "Flexible hours", icon: "flash-outline", filter: { jobType: "part-time" } },
  { title: "All Jobs", desc: "Browse everything", icon: "grid-outline", filter: {} },
];

const PILLARS = [
  { title: "Access", desc: "Talent discovery & smart matching", icon: "search" },
  { title: "Train", desc: "Skill roadmaps & interview prep", icon: "ribbon" },
  { title: "Recruit", desc: "Shortlisting & candidate tracking", icon: "people" },
  { title: "Manage", desc: "Progress tracking & retention", icon: "stats-chart" },
];

// Official RecruitKR social links (from the website footer)
const SOCIALS = [
  { icon: "logo-linkedin", color: "#0A66C2", url: "https://www.linkedin.com/company/recruitkr/" },
  { icon: "logo-facebook", color: "#1877F2", url: "https://www.facebook.com/share/183yc8uvDV/" },
  { icon: "logo-instagram", color: "#E4405F", url: "https://www.instagram.com/recruitkr_official" },
  { icon: "logo-whatsapp", color: "#25D366", url: "https://wa.me/919636315150" },
];

export default function JobListScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLang();
  const { colors, isDark } = useTheme();
  const notif = useNotifications();
  const recentCtx = useRecentlyViewed();
  const alertsCtx = useJobAlerts();
  const aiEnabled = useAIEnabled();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [quickFilter, setQuickFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ minSalary: "", postedWithin: "", sort: "newest" });
  const [recommended, setRecommended] = useState([]);
  const activeFilterCount =
    (filters.minSalary ? 1 : 0) + (filters.postedWithin ? 1 : 0) + (filters.sort !== "newest" ? 1 : 0);

  // Fade-in animation on mount
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // refresh notifications feed + check job alerts in background
  useEffect(() => { notif?.refresh(); alertsCtx?.checkAlerts(); }, []);

  // current search as alert params
  const currentParams = () => {
    const p = {};
    if (search.trim()) p.search = search.trim();
    if (category !== "All") p.category = category;
    if (quickFilter) p.jobType = quickFilter;
    return p;
  };
  const canMakeAlert = Boolean(search.trim() || category !== "All" || quickFilter);
  const alertExists = alertsCtx?.hasAlert(currentParams());

  function createAlert() {
    const label = search.trim() || quickFilter || category;
    alertsCtx?.addAlert(label, currentParams());
  }

  // Recommended jobs. When AI is enabled, use the Claude-powered matcher (returns
  // a fit score per job); otherwise fall back to a keyword search on the
  // candidate's top skill / location so the section still works.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (aiEnabled) {
          const res = await aiApi.recommend();
          if (!alive) return;
          const recs = (res.recommendations || [])
            .filter((r) => r.job)
            .map((r) => ({ ...r.job, aiScore: r.score, aiReason: r.reason }));
          if (recs.length) { setRecommended(recs); return; }
        }
        const skill = user?.skills?.[0];
        const term = skill || user?.location;
        if (!term) return;
        const res = await jobsApi.list({ search: term, limit: 10 });
        if (alive) setRecommended(res.jobs || []);
      } catch (e) { /* ignore — section just stays empty */ }
    })();
    return () => { alive = false; };
  }, [user, aiEnabled]);

  const load = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category !== "All") params.category = category;
      if (quickFilter) params.jobType = quickFilter;
      if (filters.minSalary) params.minSalary = filters.minSalary;
      if (filters.postedWithin) params.postedWithin = filters.postedWithin;
      if (filters.sort && filters.sort !== "newest") params.sort = filters.sort;
      const res = await jobsApi.list(params);
      setJobs(res.jobs);
      setTotal(res.total);
      setError(false);
    } catch (e) {
      setJobs([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, category, quickFilter, filters]);

  useEffect(() => {
    setLoading(true);
    const tmr = setTimeout(load, 350);
    return () => clearTimeout(tmr);
  }, [load]);

  const openCategory = useCallback((card) => {
    setQuickFilter(card.filter.jobType || null);
    setCategory("All");
    setSearch("");
  }, []);

  const goToDetail = useCallback(
    (jobId) => navigation.navigate("JobDetail", { jobId }),
    [navigation]
  );

  // Stable renderItem so memoized JobCards aren't re-created on every render.
  const renderItem = useCallback(
    ({ item, index }) => (
      <View style={styles.itemWrap}>
        <JobCard job={item} index={index} onPress={() => goToDetail(item._id)} />
      </View>
    ),
    [styles.itemWrap, goToDetail]
  );

  const Header = (
    <View>
      <View style={styles.topBar}>
        <View style={isDark ? styles.logoPill : null}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.bell} onPress={() => navigation.navigate("Saved")}>
            <Ionicons name="bookmark-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bell} onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            {notif?.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notif.unreadCount > 9 ? "9+" : notif.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Hi, {user?.name?.split(" ")[0] || "there"} 👋</Text>
        <Text style={styles.heroTitle}>Explore jobs with confidence</Text>
        <Text style={styles.heroSub}>Find your dream job. Connect with recruiters and apply to verified jobs.</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            placeholder={t("searchPlaceholder")}
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
            value={search}
            onChangeText={(v) => { setSearch(v); setQuickFilter(null); }}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color={colors.textLight} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color={colors.primary} />
            {activeFilterCount > 0 && (
              <View style={styles.filterDot}><Text style={styles.filterDotText}>{activeFilterCount}</Text></View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.md }}>
          {QUICK_FILTERS.map((q) => {
            const active = quickFilter === q.key;
            return (
              <TouchableOpacity
                key={q.key}
                onPress={() => setQuickFilter(active ? null : q.key)}
                style={[styles.quickChip, active && styles.quickChipActive]}
              >
                <Ionicons name={q.icon} size={15} color={active ? colors.white : colors.primary} />
                <Text style={[styles.quickChipText, active && { color: colors.white }]}>{q.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.statsRow}>
        <Stat styles={styles} value="500+" label="Active jobs" />
        <View style={styles.statDivider} />
        <Stat styles={styles} value="100+" label="Companies" />
        <View style={styles.statDivider} />
        <Stat styles={styles} value="24/7" label="Support" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by category</Text>
        <View style={styles.catGrid}>
          {CATEGORY_CARDS.map((c) => (
            <TouchableOpacity key={c.title} style={styles.catCard} activeOpacity={0.85} onPress={() => openCategory(c)}>
              <View style={styles.catIcon}>
                <Ionicons name={c.icon} size={22} color={colors.primary} />
              </View>
              <Text style={styles.catTitle}>{c.title}</Text>
              <Text style={styles.catDesc}>{c.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Browse companies shortcut */}
        <TouchableOpacity style={styles.companiesBtn} onPress={() => navigation.navigate("Companies")}>
          <Ionicons name="business" size={20} color={colors.primary} />
          <Text style={styles.companiesText}>Browse companies</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Recommended for you */}
      {recommended.length > 0 && (
        <View style={[styles.section, { paddingBottom: 0 }]}>
          <View style={styles.recoHead}>
            <Text style={styles.sectionTitle}>Recommended for you</Text>
            {aiEnabled && (
              <View style={styles.aiPill}>
                <Ionicons name="sparkles" size={11} color={colors.primary} />
                <Text style={styles.aiPillText}>AI</Text>
              </View>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm, marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg }}>
            {recommended.map((j) => (
              <TouchableOpacity
                key={j._id}
                style={styles.recoCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("JobDetail", { jobId: j._id })}
              >
                <View style={styles.recoTop}>
                  <View style={styles.recoLogo}>
                    <Text style={styles.recoLogoText}>{(j.company || "?").charAt(0).toUpperCase()}</Text>
                  </View>
                  {typeof j.aiScore === "number" && (
                    <View style={[styles.matchPill, { backgroundColor: matchTint(j.aiScore, colors) }]}>
                      <Text style={[styles.matchPillText, { color: matchColor(j.aiScore, colors) }]}>
                        {j.aiScore}% match
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.recentTitle} numberOfLines={2}>{j.title}</Text>
                <Text style={styles.recentCompany} numberOfLines={1}>{j.company}</Text>
                <Text style={styles.recentLoc} numberOfLines={1}>{j.location}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recently viewed */}
      {recentCtx?.recent?.length > 0 && (
        <View style={[styles.section, { paddingBottom: 0 }]}>
          <Text style={styles.sectionTitle}>Recently viewed</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm, marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg }}>
            {recentCtx.recent.map((j) => (
              <TouchableOpacity
                key={j._id}
                style={styles.recentCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("JobDetail", { jobId: j._id })}
              >
                <Text style={styles.recentTitle} numberOfLines={2}>{j.title}</Text>
                <Text style={styles.recentCompany} numberOfLines={1}>{j.company}</Text>
                <Text style={styles.recentLoc} numberOfLines={1}>{j.location}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.section, { paddingBottom: 0 }]}>
        <Text style={styles.sectionTitle}>Filter by sector</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm, marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg }}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => { setCategory(c); setQuickFilter(null); }}
              style={[styles.chip, category === c && styles.chipActive]}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.section, { paddingBottom: spacing.sm }]}>
        <View style={styles.jobsHead}>
          <Text style={styles.sectionTitle}>
            {quickFilter || category !== "All" || search ? "Matching jobs" : "Latest jobs"}
          </Text>
          <Text style={styles.jobsCount}>{total} found</Text>
        </View>

        {/* Create job alert for the current search */}
        {canMakeAlert && (
          <TouchableOpacity
            style={[styles.alertBtn, alertExists && styles.alertBtnDone]}
            onPress={createAlert}
            disabled={alertExists}
          >
            <Ionicons name={alertExists ? "notifications" : "notifications-outline"} size={16} color={alertExists ? colors.accentDark : colors.primary} />
            <Text style={[styles.alertText, alertExists && { color: colors.accentDark }]}>
              {alertExists ? "Alert created ✓" : "Get alerts for this search"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const Footer = (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Why RecruitKR</Text>
      <View style={styles.pillars}>
        {PILLARS.map((p) => (
          <View key={p.title} style={styles.pillar}>
            <View style={styles.pillarIcon}>
              <Ionicons name={p.icon} size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pillarTitle}>{p.title}</Text>
              <Text style={styles.pillarDesc}>{p.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Need help?</Text>
        <TouchableOpacity onPress={() => Linking.openURL("tel:+919636315150")}>
          <Text style={styles.contactText}>📞 Job seekers: +91 96363 15150</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL("mailto:careers@recruitkr.com")}>
          <Text style={styles.contactText}>📧 careers@recruitkr.com</Text>
        </TouchableOpacity>
      </View>

      {/* Social media */}
      <View style={styles.socialRow}>
        {SOCIALS.map((s) => (
          <TouchableOpacity
            key={s.icon}
            style={styles.socialBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(s.url)}
          >
            <Ionicons name={s.icon} size={22} color={s.color} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.copyright}>© 2026 RecruitKR. All rights reserved.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Animated.View style={{ flex: 1, opacity: fade }}>
        <FlatList
          data={loading ? [] : jobs}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={Header}
          ListFooterComponent={!loading && jobs.length > 0 ? Footer : null}
          renderItem={renderItem}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={9}
          removeClippedSubviews
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); notif?.refresh(); }} colors={[colors.primary]} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.itemWrap}>
                {[0, 1, 2, 3].map((i) => <JobCardSkeleton key={i} />)}
              </View>
            ) : error ? (
              <View style={styles.itemWrap}>
                <EmptyState
                  icon="cloud-offline-outline"
                  title="Couldn't load jobs"
                  subtitle="Check your connection and try again."
                />
                <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); load(); }}>
                  <Ionicons name="refresh" size={18} color={colors.white} />
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.itemWrap}>
                <EmptyState icon="briefcase-outline" title={t("noJobsFound")} subtitle="Try a different search or category." />
              </View>
            )
          }
        />
      </Animated.View>

      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={(f) => setFilters(f)}
      />
    </SafeAreaView>
  );
}

function Stat({ styles, value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const matchColor = (s, colors) =>
  s >= 75 ? colors.success : s >= 50 ? colors.warning : colors.textMuted;
const matchTint = (s, colors) => {
  const base = matchColor(s, colors);
  return base + "22";
};

const makeStyles = (colors, isDark) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl },
  itemWrap: { paddingHorizontal: spacing.lg },

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm,
  },
  logo: { width: 124, height: 53 },
  logoPill: {
    backgroundColor: "#FFFFFF", borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  topActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  bell: {
    width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.danger, alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  hero: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow(isDark),
  },
  heroEyebrow: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600" },
  heroTitle: { color: colors.white, fontSize: 25, fontWeight: "900", marginTop: spacing.xs, lineHeight: 31, letterSpacing: -0.5 },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: spacing.sm, lineHeight: 19 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.white, paddingHorizontal: spacing.lg, height: 54,
    borderRadius: radius.pill, marginTop: spacing.lg,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1A2330" },
  filterBtn: {
    marginLeft: spacing.sm, paddingLeft: spacing.sm,
    borderLeftWidth: 1, borderLeftColor: "#E4E8EC",
  },
  filterDot: {
    position: "absolute", top: -6, right: -6, minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
  },
  filterDotText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  quickChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.pill, marginRight: spacing.sm,
  },
  quickChipActive: { backgroundColor: colors.accent },
  quickChipText: { color: colors.primary, fontSize: 13, fontWeight: "700" },

  statsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: colors.surface, marginHorizontal: spacing.lg, marginTop: spacing.lg,
    borderRadius: radius.lg, paddingVertical: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 20, fontWeight: "900", color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },

  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },

  catGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: spacing.md },
  catCard: {
    width: "48%", backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
    ...shadow(isDark),
  },
  catIcon: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.sm,
  },
  catTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  catDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  companiesBtn: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs,
    backgroundColor: colors.primaryLight, padding: spacing.lg, borderRadius: radius.md,
  },
  companiesText: { flex: 1, color: colors.primary, fontWeight: "700", fontSize: 15 },
  recentCard: {
    width: 170, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  recentTitle: { fontSize: 14, fontWeight: "700", color: colors.text, minHeight: 36 },
  recentCompany: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  recentLoc: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  recoCard: {
    width: 190, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  recoTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  recoLogo: {
    width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  recoLogoText: { color: colors.primary, fontWeight: "800", fontSize: 16 },
  recoHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  aiPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill,
  },
  aiPillText: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  matchPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  matchPillText: { fontSize: 10, fontWeight: "800" },

  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.surface,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: colors.white },

  jobsHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  jobsCount: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  alertBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    marginTop: spacing.md, paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: "dashed",
  },
  alertBtnDone: { borderColor: colors.accent, borderStyle: "solid", backgroundColor: colors.accentLight },
  alertText: { color: colors.primary, fontWeight: "700", fontSize: 14 },

  pillars: { marginTop: spacing.md, gap: spacing.sm },
  pillar: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  pillarIcon: {
    width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.accentLight,
    alignItems: "center", justifyContent: "center",
  },
  pillarTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  pillarDesc: { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  contactCard: {
    backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg,
  },
  contactTitle: { fontSize: 15, fontWeight: "800", color: colors.primary, marginBottom: spacing.sm },
  contactText: { fontSize: 13, color: colors.text, marginTop: 6 },

  socialRow: { flexDirection: "row", justifyContent: "center", gap: spacing.md, marginTop: spacing.lg },
  socialBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border,
  },
  copyright: { textAlign: "center", color: colors.textLight, fontSize: 12, marginTop: spacing.lg },

  retryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    alignSelf: "center", marginTop: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary, borderRadius: radius.md,
  },
  retryText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});
