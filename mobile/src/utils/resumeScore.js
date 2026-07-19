/**
 * Resume completeness scoring.
 *
 * Deliberately rule-based and transparent: every point is traceable to a rule,
 * so the tips we show always explain the number. Same swap story as
 * `recommend.js` — replace `scoreResume()`'s body with an API call and keep the
 * `{ score, breakdown, tips }` shape.
 */

const clamp = (n, max) => Math.max(0, Math.min(max, n));
const filled = (v) => Boolean(String(v || "").trim());
const words = (v) => String(v || "").trim().split(/\s+/).filter(Boolean).length;

/** Section weights — must total 100. */
export const SECTION_WEIGHTS = {
  personal: 25,
  summary: 15,
  education: 18,
  experience: 27,
  skills: 15,
};

export function scoreResume(data) {
  const { personal = {}, education = [], experience = [], skills = [] } = data || {};
  const tips = [];
  const breakdown = {};

  // ---- Personal details ----------------------------------------------------
  const personalFields = ["name", "email", "phone", "location", "headline"];
  const personalDone = personalFields.filter((f) => filled(personal[f])).length;
  breakdown.personal = Math.round((personalDone / personalFields.length) * SECTION_WEIGHTS.personal);
  personalFields
    .filter((f) => !filled(personal[f]))
    .forEach((f) =>
      tips.push({
        section: "personal",
        text: `Add your ${f === "headline" ? "professional headline" : f}`,
        impact: Math.round(SECTION_WEIGHTS.personal / personalFields.length),
      })
    );
  if (!filled(personal.linkedin)) {
    tips.push({ section: "personal", text: "Add a LinkedIn or portfolio link — recruiters look for it", impact: 0 });
  }

  // ---- Summary / about -----------------------------------------------------
  const summaryWords = words(personal.about);
  if (summaryWords === 0) {
    breakdown.summary = 0;
    tips.push({ section: "summary", text: "Write a 2-3 line professional summary", impact: SECTION_WEIGHTS.summary });
  } else if (summaryWords < 25) {
    breakdown.summary = Math.round(SECTION_WEIGHTS.summary * 0.5);
    tips.push({
      section: "summary",
      text: `Your summary is only ${summaryWords} words — aim for 25-60`,
      impact: Math.round(SECTION_WEIGHTS.summary * 0.5),
    });
  } else if (summaryWords > 120) {
    breakdown.summary = Math.round(SECTION_WEIGHTS.summary * 0.75);
    tips.push({ section: "summary", text: "Trim the summary — keep it under 120 words", impact: Math.round(SECTION_WEIGHTS.summary * 0.25) });
  } else {
    breakdown.summary = SECTION_WEIGHTS.summary;
  }

  // ---- Education -----------------------------------------------------------
  const validEdu = education.filter((e) => filled(e.degree) && filled(e.institution));
  if (validEdu.length === 0) {
    breakdown.education = 0;
    tips.push({ section: "education", text: "Add at least one qualification", impact: SECTION_WEIGHTS.education });
  } else {
    let eduScore = SECTION_WEIGHTS.education * 0.7;
    const withYear = validEdu.filter((e) => filled(e.year)).length;
    eduScore += (withYear / validEdu.length) * SECTION_WEIGHTS.education * 0.3;
    breakdown.education = Math.round(eduScore);
    if (withYear < validEdu.length) {
      tips.push({ section: "education", text: "Add passing years to every qualification", impact: 5 });
    }
  }

  // ---- Experience ----------------------------------------------------------
  const validExp = experience.filter((e) => filled(e.role) && filled(e.company));
  if (validExp.length === 0) {
    breakdown.experience = 0;
    tips.push({
      section: "experience",
      text: "Add work experience — internships and freelance projects count",
      impact: SECTION_WEIGHTS.experience,
    });
  } else {
    // 60% for having entries (2+ is full marks), 40% for describing them well.
    let expScore = SECTION_WEIGHTS.experience * 0.6 * clamp(validExp.length / 2, 1);
    const described = validExp.filter((e) => words(e.description) >= 12).length;
    expScore += (described / validExp.length) * SECTION_WEIGHTS.experience * 0.4;
    breakdown.experience = Math.round(expScore);
    if (described < validExp.length) {
      tips.push({
        section: "experience",
        text: "Describe what you achieved in each role (12+ words, start with an action verb)",
        impact: Math.round(SECTION_WEIGHTS.experience * 0.4),
      });
    }
    if (!validExp.some((e) => /\d/.test(e.description || ""))) {
      tips.push({ section: "experience", text: "Quantify results — “cut load time by 40%” beats “improved performance”", impact: 0 });
    }
  }

  // ---- Skills --------------------------------------------------------------
  const cleanSkills = skills.filter((s) => filled(s));
  if (cleanSkills.length === 0) {
    breakdown.skills = 0;
    tips.push({ section: "skills", text: "List your key skills — this drives job matching too", impact: SECTION_WEIGHTS.skills });
  } else {
    // 6 skills is considered a complete list.
    breakdown.skills = Math.round(SECTION_WEIGHTS.skills * clamp(cleanSkills.length / 6, 1));
    if (cleanSkills.length < 6) {
      tips.push({
        section: "skills",
        text: `Add ${6 - cleanSkills.length} more skill${6 - cleanSkills.length > 1 ? "s" : ""} to strengthen matching`,
        impact: SECTION_WEIGHTS.skills - breakdown.skills,
      });
    }
  }

  const score = clamp(
    Object.values(breakdown).reduce((a, b) => a + b, 0),
    100
  );

  // Biggest wins first.
  tips.sort((a, b) => b.impact - a.impact);

  return { score, breakdown, tips };
}

export function scoreLabel(score) {
  if (score >= 85) return { label: "Excellent", tint: "success" };
  if (score >= 65) return { label: "Good", tint: "accent" };
  if (score >= 40) return { label: "Needs work", tint: "warning" };
  return { label: "Just started", tint: "danger" };
}
