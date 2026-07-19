/**
 * Job recommendation engine.
 *
 * Rule-based today, model-backed tomorrow. Every caller goes through
 * `getRecommendations()`, and the objects it returns carry the same shape the
 * server's Claude matcher already produces:
 *
 *   { ...job, matchScore: 0-100, matchReasons: string[] }
 *
 * To swap in a real AI API later, replace only the body of
 * `getRecommendations()` with the network call and keep that shape — every
 * screen (JobList, MyApplications) will pick it up with no further changes.
 * `scoreJob()` stays useful as the offline fallback when the API is down.
 */

// Weights add up to 100. Tune here, not at the call sites.
const WEIGHTS = {
  skills: 45,
  location: 22,
  category: 18,
  jobType: 8,
  freshness: 7,
};

const STOP_WORDS = new Set([
  "and", "the", "for", "with", "of", "in", "a", "an", "to", "or",
  "job", "jobs", "work", "role", "years", "year", "experience",
]);

/** "React.js, Node-JS" -> ["reactjs", "nodejs"] — cheap normalisation so
 *  "Node JS" and "node.js" score as the same skill. */
function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/** Collapse a whole skill phrase into one token: "Node.js" -> "nodejs".
 *  Without this, "Node.js" would count as two separate skill matches. */
function canon(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

/** Everything a job could be matched on: whole phrases *and* their words, so
 *  a candidate's "Node.js" still matches a job that only lists "Node". */
function jobTokens(job) {
  const set = new Set();
  [...(job.skills || []), ...(job.requirements || [])].forEach((item) => {
    const c = canon(item);
    if (c.length > 1) set.add(c);
    normalize(item).forEach((w) => set.add(w));
  });
  normalize(job.title).forEach((w) => set.add(w));
  return set;
}

/** City-level comparison: "Jaipur, Rajasthan" matches "Jaipur". */
function sameCity(a, b) {
  const at = normalize(a);
  const bt = normalize(b);
  if (!at.length || !bt.length) return false;
  return at.some((w) => bt.includes(w));
}

function isRemote(job) {
  return job?.jobType === "remote" || /remote|work from home/i.test(job?.location || "");
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Number.isFinite(ms) ? ms / 86400000 : 999;
}

/**
 * Score a single job against a candidate profile.
 * @returns {{ score: number, reasons: string[] }} score is 0-100.
 */
export function scoreJob(job, profile) {
  const { skills = [], location = "", categories = [], jobTypes = [] } = profile || {};
  const reasons = [];
  let score = 0;

  // --- Skills overlap: the strongest signal ---------------------------------
  const mySkills = skills.map((s) => String(s).trim()).filter(Boolean);
  const wanted = jobTokens(job);
  if (mySkills.length && wanted.size) {
    // One skill = one match, however many words it's written with. The original
    // spelling is kept so the reason reads "Matches your Node.js skill".
    const matched = mySkills.filter(
      (s) => wanted.has(canon(s)) || normalize(s).some((w) => wanted.has(w))
    );
    // Ratio against the candidate's own list, capped at 5 so someone with 20
    // listed skills isn't punished for only matching 4 of them.
    const ratio = Math.min(1, matched.length / Math.min(mySkills.length, 5));
    score += ratio * WEIGHTS.skills;
    if (matched.length) {
      reasons.push(
        `Matches your ${matched.slice(0, 3).join(", ")} skill${matched.length > 1 ? "s" : ""}`
      );
    }
  }

  // --- Location -------------------------------------------------------------
  if (isRemote(job)) {
    score += WEIGHTS.location;
    reasons.push("Remote — work from anywhere");
  } else if (location && sameCity(location, job.location)) {
    score += WEIGHTS.location;
    reasons.push(`In your city, ${job.location}`);
  }

  // --- Category, learned from jobs the candidate already applied to ----------
  if (categories.length && job.category) {
    const jobCat = normalize(job.category).join(" ");
    const hit = categories.find((c) => normalize(c).join(" ") === jobCat);
    if (hit) {
      score += WEIGHTS.category;
      reasons.push(`You've applied to ${hit} roles before`);
    }
  }

  // --- Preferred job type, also learned from history -------------------------
  if (jobTypes.length && job.jobType && jobTypes.includes(job.jobType)) {
    score += WEIGHTS.jobType;
  }

  // --- Freshness: nudge new postings up -------------------------------------
  const age = daysSince(job.createdAt);
  if (age <= 3) score += WEIGHTS.freshness;
  else if (age <= 14) score += WEIGHTS.freshness * 0.5;

  return { score: Math.round(Math.min(100, score)), reasons };
}

/**
 * Build the profile the scorer needs out of the raw user + application records.
 * Kept separate so screens don't have to know the scorer's input shape.
 */
export function buildProfile(user, applications = []) {
  const categories = [];
  const jobTypes = [];
  applications.forEach((a) => {
    const job = a?.job;
    if (!job) return;
    if (job.category && !categories.includes(job.category)) categories.push(job.category);
    if (job.jobType && !jobTypes.includes(job.jobType)) jobTypes.push(job.jobType);
  });
  return {
    skills: user?.skills || [],
    location: user?.location || "",
    headline: user?.headline || "",
    categories,
    jobTypes,
  };
}

/**
 * THE SWAP POINT. Returns jobs ranked for this candidate.
 *
 * @param {object}   opts
 * @param {object}   opts.user          logged-in user (skills, location, …)
 * @param {object[]} opts.jobs          candidate pool to rank
 * @param {object[]} opts.applications  the user's past applications
 * @param {number}   opts.limit         max results
 * @param {number}   opts.minScore      drop anything weaker than this
 * @returns {Promise<object[]>} [{ ...job, matchScore, matchReasons }]
 */
export async function getRecommendations({
  user,
  jobs = [],
  applications = [],
  limit = 10,
  minScore = 20,
} = {}) {
  // ---- Replace this block with an AI API call when one is available. ----
  const profile = buildProfile(user, applications);

  // Nothing to personalise on: show newest first rather than an empty section.
  const hasSignal = profile.skills.length || profile.location || profile.categories.length;

  const appliedJobIds = new Set(
    applications.map((a) => a?.job?._id || a?.job).filter(Boolean).map(String)
  );

  const ranked = jobs
    .filter((j) => j && !appliedJobIds.has(String(j._id))) // don't re-recommend
    .map((job) => {
      const { score, reasons } = scoreJob(job, profile);
      return { ...job, matchScore: score, matchReasons: reasons };
    })
    .filter((j) => (hasSignal ? j.matchScore >= minScore : true))
    .sort((a, b) => b.matchScore - a.matchScore);

  return ranked.slice(0, limit);
  // ---- end swappable block ----
}
