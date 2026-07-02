import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import { Loading } from "../../components/Common";
import AIMatchCard from "../../components/AIMatchCard";
import ApplyModal from "../../components/ApplyModal";
import { jobsApi, applicationsApi } from "../../api";
import { spacing, radius } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { notifyLocal } from "../../services/localNotify";
import { useNotifications } from "../../context/NotificationsContext";
import { useSavedJobs } from "../../context/SavedJobsContext";
import { useRecentlyViewed } from "../../context/RecentlyViewedContext";
import { useAIEnabled } from "../../hooks/useAIEnabled";
import * as haptics from "../../utils/haptics";

function formatSalary(min, max) {
  if (!min && !max) return "Not disclosed";
  const f = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)} LPA` : `${Math.round(n / 1000)}K`);
  if (min && max) return `₹${f(min)} - ₹${f(max)}`;
  return `₹${f(min || max)}`;
}

export default function JobDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const notif = useNotifications();
  const saved = useSavedJobs();
  const recent = useRecentlyViewed();
  const aiEnabled = useAIEnabled();
  const [showApply, setShowApply] = useState(false);
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const isSaved = saved?.isSaved(jobId);

  useEffect(() => {
    (async () => {
      try {
        const { job } = await jobsApi.get(jobId);
        setJob(job);
        recent?.addRecent(job);
        // Check if the user already applied to this job
        try {
          const { applications } = await applicationsApi.mine();
          if (applications?.some((a) => (a.job?._id || a.job) === jobId)) {
            setAlreadyApplied(true);
          }
        } catch (e) { /* ignore - apply will still guard */ }
      } catch (e) {
        Alert.alert("Error", e.message);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  function handleApply() {
    if (alreadyApplied) return;
    setShowApply(true); // open the simple apply form
  }

  async function submitApplication(details) {
    setApplying(true);
    try {
      await applicationsApi.apply({ jobId, ...details });
      setAlreadyApplied(true);
      setShowApply(false);
      haptics.success();
      Alert.alert("Applied! 🎉", "Your application has been sent. Track it in 'Applications'.");
      notifyLocal("Application sent ✅", `You applied to ${job?.title || "a job"}${job?.company ? " at " + job.company : ""}.`);
      notif?.refresh();
    } catch (e) {
      haptics.error();
      Alert.alert("Could not apply", e.message);
    } finally {
      setApplying(false);
    }
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `${job.title} at ${job.company} (${job.location}) — apply on RecruitKR!`,
      });
    } catch (e) { /* user cancelled */ }
  }

  if (loading) return <Loading />;
  if (!job) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Job Details</Text>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
            <Ionicons name="share-social-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          {saved ? (
            <TouchableOpacity onPress={() => saved.toggleSave(job)} style={styles.iconBtn}>
              <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? colors.accent : colors.text} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{(job.company || "?").charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.title}>{job.title}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("CompanyDetail", { name: job.company })}>
            <Text style={styles.companyLink}>{job.company} ›</Text>
          </TouchableOpacity>

          <View style={styles.tags}>
            <Tag icon="location-outline" text={job.location} styles={styles} colors={colors} />
            <Tag icon="briefcase-outline" text={job.category} styles={styles} colors={colors} />
            <Tag icon="time-outline" text={job.jobType} styles={styles} colors={colors} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Salary" value={formatSalary(job.salaryMin, job.salaryMax)} styles={styles} />
          <Stat label="Experience" value={job.experience || "Any"} styles={styles} />
        </View>

        {aiEnabled && <AIMatchCard jobId={jobId} enabled={aiEnabled} />}

        <Section title="Job Description" styles={styles}>
          <Text style={styles.body}>{job.description}</Text>
        </Section>

        {job.requirements?.length > 0 && (
          <Section title="Requirements" styles={styles}>
            {job.requirements.map((r, i) => (
              <View key={i} style={styles.bullet}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.bulletText}>{r}</Text>
              </View>
            ))}
          </Section>
        )}

        {job.skills?.length > 0 && (
          <Section title="Skills" styles={styles}>
            <View style={styles.skillWrap}>
              {job.skills.map((s, i) => (
                <View key={i} style={styles.skill}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.applyBar}>
        {alreadyApplied ? (
          <View style={styles.appliedBox}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.appliedText}>You've already applied to this job</Text>
          </View>
        ) : (
          <Button title="Apply Now" onPress={handleApply} loading={applying} />
        )}
      </View>

      <ApplyModal
        visible={showApply}
        onClose={() => setShowApply(false)}
        onSubmit={submitApplication}
        submitting={applying}
        user={user}
        jobTitle={job?.title}
      />
    </SafeAreaView>
  );
}

function Tag({ icon, text, styles, colors }) {
  return (
    <View style={styles.tag}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}
function Stat({ label, value, styles }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function Section({ title, children, styles }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  iconBtn: { padding: 4 },
  topActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  topTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  scroll: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl,
    alignItems: "center", borderWidth: 1, borderColor: colors.border,
  },
  logo: {
    width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.md,
  },
  logoText: { color: colors.primary, fontWeight: "800", fontSize: 28 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, textAlign: "center" },
  company: { fontSize: 15, color: colors.textMuted, marginTop: 4 },
  companyLink: { fontSize: 15, color: colors.primary, fontWeight: "700", marginTop: 4 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg, justifyContent: "center" },
  tag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tagText: { color: colors.primary, fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  statsRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  stat: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, alignItems: "center",
  },
  statValue: { fontSize: 16, fontWeight: "800", color: colors.primary, textAlign: "center" },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  body: { fontSize: 14, color: colors.text, lineHeight: 22 },
  bullet: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  bulletText: { fontSize: 14, color: colors.text, flex: 1 },
  skillWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  skill: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill,
  },
  skillText: { fontSize: 13, color: colors.text },
  applyBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, padding: spacing.lg,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  appliedBox: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    height: 52, borderRadius: radius.md, backgroundColor: colors.accentLight,
  },
  appliedText: { color: colors.success, fontWeight: "700", fontSize: 15 },
});
