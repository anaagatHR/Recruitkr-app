import Job from "../models/Job.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import {
  aiEnabled,
  scoreJobMatch,
  rankApplicants,
  generateJobDescription,
  parseResume,
} from "../services/aiService.js";

// GET /api/ai/status  — lets the app hide AI UI when the server has no key
export function aiStatus(req, res) {
  res.json({ enabled: aiEnabled });
}

/**
 * GET /api/ai/recommend  (candidate)
 * Returns the candidate's top job matches with an AI fit score + reason.
 * We pre-filter a small candidate pool with cheap keyword/category matching so
 * we only ask the model about a handful of jobs (keeps latency + cost low).
 */
export async function recommendJobs(req, res, next) {
  try {
    const u = req.user;
    const skills = u.skills || [];
    const orClauses = [];
    if (skills.length) orClauses.push({ skills: { $in: skills } });
    if (u.location) orClauses.push({ location: new RegExp(escapeRegex(u.location), "i") });
    if (u.headline) orClauses.push({ $text: { $search: u.headline } });

    const filter = { isActive: true };
    if (orClauses.length) filter.$or = orClauses;

    let pool = await Job.find(filter).sort({ createdAt: -1 }).limit(12).lean();
    // Fallback: if nothing matched, just take the newest jobs.
    if (pool.length === 0) {
      pool = await Job.find({ isActive: true }).sort({ createdAt: -1 }).limit(8).lean();
    }

    if (!aiEnabled) {
      // Graceful non-AI ranking so the feature still works without a key.
      const ranked = pool
        .map((j) => ({ job: j, ...keywordScore(u, j) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      return res.json({ enabled: false, recommendations: ranked });
    }

    const top = pool.slice(0, 6); // cap model calls
    const scored = await Promise.all(
      top.map(async (j) => {
        try {
          const m = await scoreJobMatch(u, j);
          return { job: j, ...m };
        } catch (e) {
          return { job: j, ...keywordScore(u, j) };
        }
      })
    );
    scored.sort((a, b) => b.score - a.score);
    res.json({ enabled: true, recommendations: scored });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ai/match/:jobId  (candidate)
 * AI fit score + reason for one specific job.
 */
export async function matchJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.jobId).lean();
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (!aiEnabled) return res.json({ enabled: false, ...keywordScore(req.user, job) });
    const m = await scoreJobMatch(req.user, job);
    res.json({ enabled: true, ...m });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ai/generate-job  (employer)
 * Drafts description + requirements + skills from a few inputs.
 * Body: { title, category, location, jobType, notes }
 */
export async function generateJob(req, res, next) {
  try {
    if (!aiEnabled) return res.status(503).json({ message: "AI is not configured on the server." });
    const { title, category, location, jobType, notes } = req.body || {};
    if (!title) return res.status(400).json({ message: "A job title is required." });
    const draft = await generateJobDescription({
      title,
      company: req.user.companyName || req.user.name,
      category,
      location,
      jobType,
      notes,
    });
    res.json({ draft });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ai/parse-resume  (candidate)
 * Body: { text }  — pasted resume text → structured profile fields.
 */
export async function resumeToProfile(req, res, next) {
  try {
    if (!aiEnabled) return res.status(503).json({ message: "AI is not configured on the server." });
    const text = (req.body?.text || "").trim();
    if (text.length < 30) {
      return res.status(400).json({ message: "Please paste more of your resume text." });
    }
    const profile = await parseResume(text);
    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ai/rank/:jobId  (employer, owner only)
 * Ranks the job's applicants by AI fit.
 */
export async function rankJobApplicants(req, res, next) {
  try {
    const job = await Job.findById(req.params.jobId).lean();
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (String(job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only rank applicants for your own jobs" });
    }

    const apps = await Application.find({ job: job._id })
      .populate("candidate", "name headline skills experience location")
      .limit(30)
      .lean();

    const applicants = apps.map((a) => ({
      id: String(a._id),
      candidateId: String(a.candidate?._id || ""),
      name: a.candidate?.name || "Candidate",
      headline: a.candidate?.headline,
      skills: a.candidate?.skills,
      experience: a.candidate?.experience,
      location: a.candidate?.location,
      status: a.status,
    }));

    if (applicants.length === 0) return res.json({ enabled: aiEnabled, ranked: [] });

    if (!aiEnabled) {
      const ranked = applicants
        .map((a) => ({ ...a, ...keywordScore({ skills: a.skills, location: a.location }, job) }))
        .sort((x, y) => y.score - x.score);
      return res.json({ enabled: false, ranked });
    }

    const scores = await rankApplicants(job, applicants);
    const byId = new Map(scores.map((s) => [s.id, s]));
    const ranked = applicants
      .map((a) => {
        const s = byId.get(a.id) || keywordScore({ skills: a.skills, location: a.location }, job);
        return { ...a, score: s.score, reason: s.reason };
      })
      .sort((x, y) => y.score - x.score);
    res.json({ enabled: true, ranked });
  } catch (err) {
    next(err);
  }
}

/* --------------------------- helpers --------------------------- */

// Cheap deterministic score used as a fallback when AI is off or errors.
function keywordScore(user, job) {
  const uSkills = (user.skills || []).map((s) => s.toLowerCase());
  const jSkills = (job.skills || []).map((s) => s.toLowerCase());
  const matched = jSkills.filter((s) => uSkills.includes(s));
  const missing = jSkills.filter((s) => !uSkills.includes(s));
  let score = jSkills.length ? Math.round((matched.length / jSkills.length) * 80) : 40;
  if (user.location && job.location &&
      job.location.toLowerCase().includes(String(user.location).toLowerCase())) {
    score += 15;
  }
  score = Math.max(5, Math.min(100, score));
  return {
    score,
    reason: matched.length
      ? `Matches ${matched.length} of ${jSkills.length} required skills.`
      : "Based on your profile and this role.",
    matchedSkills: matched,
    missingSkills: missing,
  };
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
