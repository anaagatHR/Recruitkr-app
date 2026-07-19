import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Input from "../../components/Input";
import Dropdown from "../../components/Dropdown";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { authApi } from "../../api";
import { scoreResume, scoreLabel, SECTION_WEIGHTS } from "../../utils/resumeScore";
import { buildResumeHtml } from "../../utils/resumeHtml";
import { INDIAN_CITIES } from "../../constants/cities";
import { spacing, radius } from "../../theme/colors";
import * as haptics from "../../utils/haptics";

const DRAFT_KEY = "resumeDraft";

const STEPS = [
  { key: "personal", label: "About", icon: "person" },
  { key: "education", label: "Education", icon: "school" },
  { key: "experience", label: "Work", icon: "briefcase" },
  { key: "skills", label: "Skills", icon: "construct" },
  { key: "preview", label: "Preview", icon: "eye" },
];

const emptyEducation = () => ({ degree: "", institution: "", year: "", score: "" });
const emptyExperience = () => ({ role: "", company: "", start: "", end: "", description: "" });

export default function ResumeBuilderScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState({
    personal: { name: "", headline: "", email: "", phone: "", location: "", linkedin: "", about: "" },
    education: [emptyEducation()],
    experience: [emptyExperience()],
    skills: [],
  });

  // Load the saved draft, falling back to whatever the profile already knows so
  // the first step is never a blank form.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (raw) {
          setData(JSON.parse(raw));
          setReady(true);
          return;
        }
      } catch (e) { /* fall through to profile prefill */ }
      setData((d) => ({
        ...d,
        personal: {
          ...d.personal,
          name: user?.name || "",
          headline: user?.headline || "",
          email: user?.email || "",
          phone: user?.phone || "",
          location: user?.location || "",
          about: user?.about || "",
        },
        skills: user?.skills?.length ? user.skills : [],
      }));
      setReady(true);
    })();
  }, [user]);

  // Autosave the draft (skipped until the initial load finishes, so we never
  // overwrite a saved draft with the empty initial state).
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(data)).catch(() => {});
  }, [data, ready]);

  const { score, breakdown, tips } = useMemo(() => scoreResume(data), [data]);
  const rating = scoreLabel(score);
  const ratingColor = colors[rating.tint] || colors.warning;

  const setPersonal = (k) => (v) =>
    setData((d) => ({ ...d, personal: { ...d.personal, [k]: v } }));

  const setListItem = (list, index, key) => (value) =>
    setData((d) => ({
      ...d,
      [list]: d[list].map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));

  const addItem = (list, factory) => () => {
    haptics.tap();
    setData((d) => ({ ...d, [list]: [...d[list], factory()] }));
  };

  const removeItem = (list, index) => () => {
    haptics.tap();
    setData((d) => ({ ...d, [list]: d[list].filter((_, i) => i !== index) }));
  };

  const next = () => { haptics.tap(); setStep((s) => Math.min(STEPS.length - 1, s + 1)); };
  const back = () => { haptics.tap(); setStep((s) => Math.max(0, s - 1)); };

  /** Push the resume's details back onto the user's profile, so job matching
   *  and employer-facing views benefit from the work done here. */
  async function syncToProfile() {
    try {
      const { personal, skills } = data;
      await authApi.updateMe({
        headline: personal.headline,
        phone: personal.phone,
        location: personal.location,
        about: personal.about,
        skills: skills.filter((s) => s.trim()),
      });
      haptics.success();
      Alert.alert("Profile updated", "Your resume details were saved to your profile.");
    } catch (e) {
      Alert.alert("Couldn't save", e.message);
    }
  }

  const exportPdf = useCallback(async () => {
    if (!data.personal.name.trim()) {
      Alert.alert("Name required", "Add your name before downloading the resume.");
      return;
    }
    setExporting(true);
    try {
      const html = buildResumeHtml(data);
      if (Platform.OS === "web") {
        // On web, printAsync opens the browser's print/save-as-PDF dialog.
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: "Save or share your resume",
            UTI: "com.adobe.pdf",
          });
        } else {
          Alert.alert("Resume ready", `Saved to:\n${uri}`);
        }
      }
      haptics.success();
    } catch (e) {
      haptics.error();
      Alert.alert("Export failed", e.message);
    } finally {
      setExporting(false);
    }
  }, [data]);

  const current = STEPS[step];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Resume Builder</Text>
        <View style={[styles.scorePill, { backgroundColor: ratingColor + (isDark ? "33" : "1A") }]}>
          <Text style={[styles.scorePillText, { color: ratingColor }]}>{score}</Text>
        </View>
      </View>

      {/* Step tracker */}
      <View style={styles.stepper}>
        {STEPS.map((s, i) => {
          const done = i <= step;
          return (
            <React.Fragment key={s.key}>
              {i > 0 && <View style={[styles.stepLine, i <= step && { backgroundColor: colors.primary }]} />}
              <TouchableOpacity
                style={styles.stepItem}
                activeOpacity={0.8}
                onPress={() => { haptics.tap(); setStep(i); }}
              >
                <View style={[styles.stepCircle, done && styles.stepCircleDone]}>
                  <Ionicons name={s.icon} size={15} color={done ? colors.white : colors.textLight} />
                </View>
                <Text style={[styles.stepLabel, done && styles.stepLabelDone]} numberOfLines={1}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* ---------------- Step 1: personal ---------------- */}
          {current.key === "personal" && (
            <View>
              <SectionHead styles={styles} title="Personal details" subtitle="This sits at the top of your resume." />
              <Input label="Full Name" value={data.personal.name} onChangeText={setPersonal("name")} />
              <Input label="Professional Headline" placeholder="e.g. Frontend Developer" value={data.personal.headline} onChangeText={setPersonal("headline")} />
              <Input label="Email" keyboardType="email-address" autoCapitalize="none" value={data.personal.email} onChangeText={setPersonal("email")} />
              <Input label="Phone" keyboardType="phone-pad" value={data.personal.phone} onChangeText={setPersonal("phone")} />
              <Dropdown
                label="Location"
                value={data.personal.location}
                onValueChange={setPersonal("location")}
                items={INDIAN_CITIES}
                searchable
                placeholder="Select a city"
              />
              <Input label="LinkedIn / Portfolio" placeholder="linkedin.com/in/you" autoCapitalize="none" value={data.personal.linkedin} onChangeText={setPersonal("linkedin")} />
              <Input
                label="Professional Summary"
                placeholder="2-3 lines about your experience and what you're looking for"
                value={data.personal.about}
                onChangeText={setPersonal("about")}
                multiline
                numberOfLines={5}
              />
            </View>
          )}

          {/* ---------------- Step 2: education ---------------- */}
          {current.key === "education" && (
            <View>
              <SectionHead styles={styles} title="Education" subtitle="Most recent qualification first." />
              {data.education.map((edu, i) => (
                <View key={i} style={styles.entryCard}>
                  <View style={styles.entryHead}>
                    <Text style={styles.entryIndex}>Qualification {i + 1}</Text>
                    {data.education.length > 1 && (
                      <TouchableOpacity onPress={removeItem("education", i)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Input label="Degree / Course" placeholder="B.Tech Computer Science" value={edu.degree} onChangeText={setListItem("education", i, "degree")} />
                  <Input label="Institution" placeholder="University / College name" value={edu.institution} onChangeText={setListItem("education", i, "institution")} />
                  <Input label="Year" placeholder="2020 - 2024" value={edu.year} onChangeText={setListItem("education", i, "year")} />
                  <Input label="Grade (optional)" placeholder="8.4 CGPA / 82%" value={edu.score} onChangeText={setListItem("education", i, "score")} />
                </View>
              ))}
              <AddButton styles={styles} colors={colors} label="Add another qualification" onPress={addItem("education", emptyEducation)} />
            </View>
          )}

          {/* ---------------- Step 3: experience ---------------- */}
          {current.key === "experience" && (
            <View>
              <SectionHead styles={styles} title="Work experience" subtitle="Internships and freelance work count too." />
              {data.experience.map((exp, i) => (
                <View key={i} style={styles.entryCard}>
                  <View style={styles.entryHead}>
                    <Text style={styles.entryIndex}>Role {i + 1}</Text>
                    {data.experience.length > 1 && (
                      <TouchableOpacity onPress={removeItem("experience", i)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Input label="Job Title" placeholder="Frontend Developer" value={exp.role} onChangeText={setListItem("experience", i, "role")} />
                  <Input label="Company" placeholder="Company name" value={exp.company} onChangeText={setListItem("experience", i, "company")} />
                  <View style={styles.dateRow}>
                    <View style={{ flex: 1 }}>
                      <Input label="From" placeholder="Jan 2023" value={exp.start} onChangeText={setListItem("experience", i, "start")} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label="To" placeholder="Present" value={exp.end} onChangeText={setListItem("experience", i, "end")} />
                    </View>
                  </View>
                  <Input
                    label="What you did"
                    placeholder="Built X which achieved Y. Use numbers where you can."
                    value={exp.description}
                    onChangeText={setListItem("experience", i, "description")}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              ))}
              <AddButton styles={styles} colors={colors} label="Add another role" onPress={addItem("experience", emptyExperience)} />
            </View>
          )}

          {/* ---------------- Step 4: skills ---------------- */}
          {current.key === "skills" && (
            <View>
              <SectionHead styles={styles} title="Skills" subtitle="Comma separated — these also power your job matches." />
              <Input
                label="Your skills"
                placeholder="React, Node.js, SQL, Communication"
                value={data.skills.join(", ")}
                onChangeText={(v) =>
                  setData((d) => ({ ...d, skills: v.split(",").map((s) => s.replace(/^\s+/, "")) }))
                }
                multiline
                numberOfLines={3}
              />
              {data.skills.filter((s) => s.trim()).length > 0 && (
                <View style={styles.skillWrap}>
                  {data.skills.filter((s) => s.trim()).map((s, i) => (
                    <View key={i} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{s.trim()}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ---------------- Step 5: preview + score ---------------- */}
          {current.key === "preview" && (
            <View>
              {/* Score card */}
              <View style={styles.scoreCard}>
                <View style={styles.scoreHead}>
                  <View style={[styles.scoreRing, { borderColor: ratingColor }]}>
                    <Text style={[styles.scoreValue, { color: ratingColor }]}>{score}</Text>
                    <Text style={styles.scoreOutOf}>/100</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scoreTitle}>Resume Score</Text>
                    <Text style={[styles.scoreRating, { color: ratingColor }]}>{rating.label}</Text>
                    <View style={styles.bar}>
                      <View style={[styles.barFill, { width: `${score}%`, backgroundColor: ratingColor }]} />
                    </View>
                  </View>
                </View>

                {/* Per-section breakdown */}
                <View style={styles.breakdown}>
                  {Object.keys(SECTION_WEIGHTS).map((key) => {
                    const got = breakdown[key] || 0;
                    const max = SECTION_WEIGHTS[key];
                    const full = got >= max;
                    return (
                      <View key={key} style={styles.breakRow}>
                        <Ionicons
                          name={full ? "checkmark-circle" : got > 0 ? "ellipse-outline" : "close-circle-outline"}
                          size={16}
                          color={full ? colors.success : got > 0 ? colors.warning : colors.textLight}
                        />
                        <Text style={styles.breakLabel}>{key}</Text>
                        <Text style={styles.breakScore}>{got}/{max}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Improvement tips */}
              {tips.length > 0 && (
                <View style={styles.tipsCard}>
                  <View style={styles.tipsHead}>
                    <Ionicons name="bulb" size={18} color={colors.warning} />
                    <Text style={styles.tipsTitle}>How to improve</Text>
                  </View>
                  {tips.slice(0, 6).map((tip, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.tipRow}
                      activeOpacity={0.8}
                      onPress={() => {
                        const target = STEPS.findIndex(
                          (s) => s.key === (tip.section === "summary" ? "personal" : tip.section)
                        );
                        if (target >= 0) setStep(target);
                      }}
                    >
                      <Text style={styles.tipText}>{tip.text}</Text>
                      {tip.impact > 0 && (
                        <View style={styles.tipImpact}>
                          <Text style={styles.tipImpactText}>+{tip.impact}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Live resume preview */}
              <SectionHead styles={styles} title="Preview" subtitle="This is what your PDF will look like." />
              <View style={styles.paper}>
                <Text style={styles.pName}>{data.personal.name || "Your Name"}</Text>
                {!!data.personal.headline && <Text style={styles.pHeadline}>{data.personal.headline}</Text>}
                <Text style={styles.pContact}>
                  {[data.personal.email, data.personal.phone, data.personal.location, data.personal.linkedin]
                    .filter((v) => v && v.trim())
                    .join("  •  ")}
                </Text>

                {!!data.personal.about?.trim() && (
                  <PaperSection styles={styles} title="Summary">
                    <Text style={styles.pBody}>{data.personal.about}</Text>
                  </PaperSection>
                )}

                {data.experience.some((e) => e.role || e.company) && (
                  <PaperSection styles={styles} title="Experience">
                    {data.experience
                      .filter((e) => e.role || e.company)
                      .map((e, i) => (
                        <View key={i} style={styles.pEntry}>
                          <View style={styles.pEntryHead}>
                            <Text style={styles.pRole}>{e.role}</Text>
                            <Text style={styles.pDates}>
                              {e.start}{e.end ? ` – ${e.end}` : e.start ? " – Present" : ""}
                            </Text>
                          </View>
                          {!!e.company && <Text style={styles.pOrg}>{e.company}</Text>}
                          {!!e.description && <Text style={styles.pBody}>{e.description}</Text>}
                        </View>
                      ))}
                  </PaperSection>
                )}

                {data.education.some((e) => e.degree || e.institution) && (
                  <PaperSection styles={styles} title="Education">
                    {data.education
                      .filter((e) => e.degree || e.institution)
                      .map((e, i) => (
                        <View key={i} style={styles.pEntry}>
                          <View style={styles.pEntryHead}>
                            <Text style={styles.pRole}>{e.degree}</Text>
                            <Text style={styles.pDates}>{e.year}</Text>
                          </View>
                          {!!e.institution && <Text style={styles.pOrg}>{e.institution}</Text>}
                          {!!e.score && <Text style={styles.pBody}>{e.score}</Text>}
                        </View>
                      ))}
                  </PaperSection>
                )}

                {data.skills.filter((s) => s.trim()).length > 0 && (
                  <PaperSection styles={styles} title="Skills">
                    <View style={styles.pSkills}>
                      {data.skills.filter((s) => s.trim()).map((s, i) => (
                        <View key={i} style={styles.pSkill}>
                          <Text style={styles.pSkillText}>{s.trim()}</Text>
                        </View>
                      ))}
                    </View>
                  </PaperSection>
                )}
              </View>

              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={exportPdf}
                disabled={exporting}
                activeOpacity={0.85}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Ionicons name="download-outline" size={20} color={colors.white} />
                )}
                <Text style={styles.downloadText}>
                  {exporting ? "Generating PDF..." : "Download PDF resume"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.syncBtn} onPress={syncToProfile} activeOpacity={0.85}>
                <Ionicons name="sync-outline" size={18} color={colors.primary} />
                <Text style={styles.syncText}>Save details to my profile</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        {/* Wizard nav */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={[styles.navBtn, styles.navBack, step === 0 && styles.navDisabled]}
            onPress={back}
            disabled={step === 0}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={18} color={colors.primary} />
            <Text style={styles.navBackText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, styles.navNext, step === STEPS.length - 1 && styles.navDisabled]}
            onPress={next}
            disabled={step === STEPS.length - 1}
            activeOpacity={0.85}
          >
            <Text style={styles.navNextText}>
              {step === STEPS.length - 2 ? "Preview & Score" : "Next"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionHead({ styles, title, subtitle }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
    </View>
  );
}

function AddButton({ styles, colors, label, onPress }) {
  return (
    <TouchableOpacity style={styles.addBtn} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
      <Text style={styles.addText}>{label}</Text>
    </TouchableOpacity>
  );
}

function PaperSection({ styles, title, children }) {
  return (
    <View style={styles.pSection}>
      <Text style={styles.pSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  topTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  scorePill: { minWidth: 40, alignItems: "center", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  scorePillText: { fontSize: 13, fontWeight: "800" },

  // stepper
  stepper: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  stepItem: { alignItems: "center", width: 56 },
  stepCircle: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2,
    borderColor: colors.border, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center",
  },
  stepCircleDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginTop: 14, marginHorizontal: -4 },
  stepLabel: { fontSize: 10, fontWeight: "600", color: colors.textLight, marginTop: 5 },
  stepLabelDone: { color: colors.text, fontWeight: "700" },

  scroll: { padding: spacing.lg, paddingTop: 0 },
  sectionHead: { marginBottom: spacing.lg, marginTop: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  entryCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  entryHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  entryIndex: { fontSize: 12, fontWeight: "800", color: colors.textMuted, letterSpacing: 0.5, textTransform: "uppercase" },
  dateRow: { flexDirection: "row", gap: spacing.md },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: "dashed",
    borderRadius: radius.md, paddingVertical: 14,
  },
  addText: { color: colors.primary, fontWeight: "700", fontSize: 14 },

  skillWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  skillChip: {
    backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill,
  },
  skillChipText: { color: colors.primary, fontSize: 13, fontWeight: "600" },

  // score card
  scoreCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  scoreHead: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  scoreRing: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 5,
    alignItems: "center", justifyContent: "center",
  },
  scoreValue: { fontSize: 24, fontWeight: "800" },
  scoreOutOf: { fontSize: 10, color: colors.textMuted, marginTop: -2 },
  scoreTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  scoreRating: { fontSize: 13, fontWeight: "700", marginTop: 1 },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.border, marginTop: spacing.sm, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  breakdown: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: spacing.sm },
  breakRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  breakLabel: { flex: 1, fontSize: 13, color: colors.text, fontWeight: "600", textTransform: "capitalize" },
  breakScore: { fontSize: 12, color: colors.textMuted, fontWeight: "700" },

  tipsCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg,
  },
  tipsHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.md },
  tipsTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  tipRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  tipText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  tipImpact: {
    backgroundColor: colors.accentLight, borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  tipImpactText: { fontSize: 11, fontWeight: "800", color: colors.accentDark },

  // paper preview — intentionally light in both themes; it mirrors the PDF.
  paper: {
    backgroundColor: "#FFFFFF", borderRadius: radius.md, padding: spacing.lg,
    borderWidth: 1, borderColor: isDark ? colors.border : "#E4E8EC",
  },
  pName: { fontSize: 22, fontWeight: "800", color: "#1A2330", letterSpacing: -0.4 },
  pHeadline: { fontSize: 14, fontWeight: "700", color: "#274B7F", marginTop: 2 },
  pContact: { fontSize: 11, color: "#6B7785", marginTop: 6, lineHeight: 16 },
  pSection: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: "#E4E8EC", paddingTop: spacing.md },
  pSectionTitle: {
    fontSize: 11, fontWeight: "800", color: "#274B7F",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: spacing.sm,
  },
  pEntry: { marginBottom: spacing.md },
  pEntryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: spacing.sm },
  pRole: { fontSize: 14, fontWeight: "700", color: "#1A2330", flex: 1 },
  pDates: { fontSize: 11, color: "#6B7785" },
  pOrg: { fontSize: 12, color: "#6B7785", marginTop: 1 },
  pBody: { fontSize: 12.5, color: "#1A2330", lineHeight: 18, marginTop: 4 },
  pSkills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pSkill: { backgroundColor: "#E8EEF6", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  pSkillText: { fontSize: 11.5, fontWeight: "600", color: "#274B7F" },

  downloadBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 16, marginTop: spacing.lg,
  },
  downloadText: { color: colors.white, fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },
  syncBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1, borderColor: colors.primary + "55", backgroundColor: colors.primary + "12",
    borderRadius: radius.md, paddingVertical: 14, marginTop: spacing.md,
  },
  syncText: { color: colors.primary, fontWeight: "700", fontSize: 14 },

  navBar: {
    flexDirection: "row", gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  navBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
    borderRadius: radius.md, paddingVertical: 14,
  },
  navBack: { backgroundColor: colors.primaryLight },
  navBackText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
  navNext: { backgroundColor: colors.primary },
  navNextText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  navDisabled: { opacity: 0.4 },
});
