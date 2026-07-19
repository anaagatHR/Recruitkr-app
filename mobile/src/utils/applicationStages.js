/**
 * The hiring pipeline a candidate moves through, shared by the status badge,
 * the progress tracker and the dashboard filters so they can never disagree.
 *
 * "rejected" is deliberately not a stage — it's a terminal outcome that can
 * happen at any point, so the tracker renders it as a stopped pipeline instead
 * of a fifth step.
 */
export const STAGES = [
  { key: "applied", label: "Applied", icon: "paper-plane", tint: "info", hint: "Application sent to the employer" },
  { key: "shortlisted", label: "Shortlisted", icon: "star", tint: "warning", hint: "Your profile was picked for review" },
  { key: "interview", label: "Interview", icon: "people", tint: "primary", hint: "Interview round scheduled" },
  { key: "hired", label: "Hired", icon: "trophy", tint: "success", hint: "Offer extended — congratulations!" },
];

export const REJECTED = {
  key: "rejected",
  label: "Rejected",
  icon: "close-circle",
  tint: "danger",
  hint: "The employer moved ahead with other candidates",
};

/** All statuses a UI may need to display, pipeline order first. */
export const ALL_STATUSES = [...STAGES.map((s) => s.key), REJECTED.key];

export function getStage(status) {
  return STAGES.find((s) => s.key === status) || (status === REJECTED.key ? REJECTED : STAGES[0]);
}

/** Index in the pipeline; -1 for rejected (off-track). */
export function stageIndex(status) {
  if (status === REJECTED.key) return -1;
  const i = STAGES.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

/** Resolve a stage's `tint` name against the active theme palette. */
export function stageColor(status, colors) {
  return colors[getStage(status).tint] || colors.info;
}

/** Soft background for a badge/pill — translucent in dark mode so it stays readable. */
export function tintBg(hex, isDark) {
  return hex + (isDark ? "33" : "1A");
}
