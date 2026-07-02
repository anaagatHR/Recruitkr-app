import React, { useState, useMemo, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Input from "../../components/Input";
import Dropdown from "../../components/Dropdown";
import Button from "../../components/Button";
import { jobsApi, aiApi } from "../../api";
import { spacing, radius } from "../../theme/colors";
import { useTheme } from "../../context/ThemeContext";
import { useAIEnabled } from "../../hooks/useAIEnabled";
import * as haptics from "../../utils/haptics";
import { INDIAN_CITIES } from "../../constants/cities";

const JOB_TYPES = ["full-time", "part-time", "remote", "internship", "freelance", "gig"];
const CATEGORIES = ["IT", "Healthcare", "Banking", "Retail", "Manufacturing", "Logistics"];

export default function PostJobScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const editingId = route.params?.jobId || null; // present => edit mode
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const aiEnabled = useAIEnabled();

  const [form, setForm] = useState({
    title: "", location: "", description: "", experience: "",
    salaryMin: "", salaryMax: "", requirements: "", skills: "",
  });
  const [jobType, setJobType] = useState("full-time");
  const [category, setCategory] = useState("IT");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);

  // In edit mode, load the existing job and pre-fill the form
  useEffect(() => {
    if (!editingId) return;
    setFetching(true);
    (async () => {
      try {
        const { job } = await jobsApi.get(editingId);
        setForm({
          title: job.title || "",
          location: job.location || "",
          description: job.description || "",
          experience: job.experience || "",
          salaryMin: job.salaryMin ? String(job.salaryMin) : "",
          salaryMax: job.salaryMax ? String(job.salaryMax) : "",
          requirements: (job.requirements || []).join("\n"),
          skills: (job.skills || []).join(", "),
        });
        setJobType(job.jobType || "full-time");
        setCategory(job.category || "IT");
      } catch (e) {
        Alert.alert("Error", e.message);
      } finally {
        setFetching(false);
      }
    })();
  }, [editingId]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function generateWithAI() {
    if (!form.title) {
      Alert.alert("Add a job title first");
      return;
    }
    haptics.tap();
    setGenerating(true);
    try {
      const { draft } = await aiApi.generateJob({
        title: form.title,
        category,
        location: form.location,
        jobType,
        notes: form.description,
      });
      setForm((f) => ({
        ...f,
        description: draft.description || f.description,
        requirements: (draft.requirements || []).join("\n"),
        skills: (draft.skills || []).join(", "),
      }));
      haptics.success();
      Alert.alert("Draft ready ✨", "Review and edit before posting.");
    } catch (e) {
      haptics.error();
      Alert.alert("Error", e.message);
    } finally {
      setGenerating(false);
    }
  }

  function validate() {
    if (!form.title || !form.location || !form.description) {
      Alert.alert("Missing details", "Title, location and description are required.");
      return false;
    }
    const min = Number(form.salaryMin), max = Number(form.salaryMax);
    if (form.salaryMin && form.salaryMax && min > max) {
      Alert.alert("Check salary", "Minimum salary cannot be more than maximum salary.");
      return false;
    }
    return true;
  }

  async function submit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        location: form.location,
        description: form.description,
        experience: form.experience,
        jobType,
        category,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        requirements: form.requirements.split("\n").map((s) => s.trim()).filter(Boolean),
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      };
      if (editingId) {
        await jobsApi.update(editingId, payload);
        Alert.alert("Updated ✅", "Your job has been updated.");
      } else {
        await jobsApi.create(payload);
        Alert.alert("Posted! 🎉", "Your job is now live.");
        setForm({ title: "", location: "", description: "", experience: "", salaryMin: "", salaryMax: "", requirements: "", skills: "" });
      }
      // Go back to the jobs list cleanly
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate("My Jobs");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  const isEdit = Boolean(editingId);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        {isEdit ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : <View style={{ width: 24 }} />}
        <Text style={styles.headerTitle}>{isEdit ? "Edit Job" : "Post a New Job"}</Text>
        <View style={{ width: 24 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Input label="Job Title *" placeholder="e.g. React Native Developer" value={form.title} onChangeText={set("title")} />
          <Dropdown label="Location *" value={form.location} onValueChange={set("location")} items={INDIAN_CITIES} searchable placeholder="Select a city" />

          <Text style={styles.label}>Job Type</Text>
          <View style={styles.chipRow}>
            {JOB_TYPES.map((t) => (
              <TouchableOpacity key={t} onPress={() => setJobType(t)} style={[styles.chip, jobType === t && styles.chipActive]}>
                <Text style={[styles.chipText, jobType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.salaryRow}>
            <Input label="Salary Min (₹/yr)" placeholder="300000" keyboardType="numeric" value={form.salaryMin} onChangeText={set("salaryMin")} style={{ flex: 1 }} />
            <Input label="Salary Max (₹/yr)" placeholder="600000" keyboardType="numeric" value={form.salaryMax} onChangeText={set("salaryMax")} style={{ flex: 1 }} />
          </View>

          <Input label="Experience" placeholder="e.g. 2-4 years" value={form.experience} onChangeText={set("experience")} />

          {aiEnabled && !isEdit && (
            <TouchableOpacity
              style={[styles.aiBtn, generating && styles.aiBtnDisabled]}
              onPress={generateWithAI}
              disabled={generating}
              activeOpacity={0.85}
            >
              {generating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              )}
              <Text style={styles.aiBtnText}>
                {generating ? "Generating…" : "Generate with AI"}
              </Text>
            </TouchableOpacity>
          )}

          <Input label="Description *" placeholder="Describe the role..." value={form.description} onChangeText={set("description")} multiline numberOfLines={5} />
          <Input label="Requirements (one per line)" placeholder={"2+ years experience\nGood communication"} value={form.requirements} onChangeText={set("requirements")} multiline numberOfLines={4} />
          <Input label="Skills (comma separated)" placeholder="React, Node, SQL" value={form.skills} onChangeText={set("skills")} />

          <Button title={isEdit ? "Save Changes" : "Post Job"} onPress={submit} loading={loading || fetching} />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  scroll: { padding: spacing.lg },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  chipTextActive: { color: colors.white },
  salaryRow: { flexDirection: "row", gap: spacing.md },
  aiBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primary + "55",
    backgroundColor: colors.primary + "12", marginBottom: spacing.md,
  },
  aiBtnDisabled: { opacity: 0.6 },
  aiBtnText: { color: colors.primary, fontWeight: "800", fontSize: 14, letterSpacing: 0.3 },
});
