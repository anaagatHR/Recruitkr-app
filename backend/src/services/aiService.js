import Anthropic from "@anthropic-ai/sdk";

/**
 * Thin wrapper around the Claude API for RecruitKR's AI features.
 *
 * The API key lives ONLY in the backend env (ANTHROPIC_API_KEY) so it never
 * ships in the mobile app. If the key is absent, `aiEnabled` is false and every
 * function throws a clear, catchable error — callers return a friendly message
 * so the app degrades gracefully instead of crashing.
 */

const MODEL = process.env.AI_MODEL || "claude-haiku-4-5-20251001";

let client = null;
export const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);
if (aiEnabled) {
  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function ensureEnabled() {
  if (!aiEnabled) {
    const e = new Error("AI is not configured on the server.");
    e.status = 503;
    throw e;
  }
}

/**
 * Ask Claude to return strict JSON and parse it. We instruct the model to emit
 * ONLY JSON; we also strip any accidental markdown fences before parsing.
 */
async function askJSON({ system, prompt, maxTokens = 1024 }) {
  ensureEnabled();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const text = (msg.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Last resort: pull the first {...} or [...] block out of the text.
    const match = cleaned.match(/[{[][\s\S]*[}\]]/);
    if (match) return JSON.parse(match[0]);
    const err = new Error("AI returned an unexpected response.");
    err.status = 502;
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* 1) Job match score — how well a candidate fits a job (0-100 + why)  */
/* ------------------------------------------------------------------ */
export async function scoreJobMatch(candidate, job) {
  const system =
    "You are an expert technical recruiter. Score how well a candidate matches a job. " +
    "Be realistic and concise. Respond with ONLY a JSON object, no prose.";
  const prompt =
    `CANDIDATE:\n` +
    `Headline: ${candidate.headline || "N/A"}\n` +
    `Skills: ${(candidate.skills || []).join(", ") || "N/A"}\n` +
    `Experience: ${candidate.experience || "N/A"}\n` +
    `Location: ${candidate.location || "N/A"}\n` +
    `About: ${candidate.about || "N/A"}\n\n` +
    `JOB:\n` +
    `Title: ${job.title}\n` +
    `Category: ${job.category}\n` +
    `Location: ${job.location}\n` +
    `Type: ${job.jobType}\n` +
    `Skills: ${(job.skills || []).join(", ") || "N/A"}\n` +
    `Requirements: ${(job.requirements || []).join("; ") || "N/A"}\n` +
    `Experience needed: ${job.experience || "N/A"}\n` +
    `Description: ${(job.description || "").slice(0, 800)}\n\n` +
    `Return JSON: {"score": <0-100 integer>, "reason": "<one short sentence>", ` +
    `"matchedSkills": ["..."], "missingSkills": ["..."]}`;
  const out = await askJSON({ system, prompt, maxTokens: 400 });
  return {
    score: clampScore(out.score),
    reason: String(out.reason || "").slice(0, 240),
    matchedSkills: arr(out.matchedSkills),
    missingSkills: arr(out.missingSkills),
  };
}

/* ------------------------------------------------------------------ */
/* 2) Rank applicants for a job (employer view)                        */
/* ------------------------------------------------------------------ */
export async function rankApplicants(job, applicants) {
  const system =
    "You are an expert recruiter ranking applicants for a job. " +
    "Respond with ONLY a JSON array, no prose.";
  const list = applicants
    .map(
      (a, i) =>
        `#${i} id=${a.id} | ${a.name} | headline=${a.headline || "N/A"} | ` +
        `skills=${(a.skills || []).join(", ") || "N/A"} | exp=${a.experience || "N/A"}`
    )
    .join("\n");
  const prompt =
    `JOB: ${job.title} (${job.category}, ${job.location}). ` +
    `Needs skills: ${(job.skills || []).join(", ") || "N/A"}. ` +
    `Requirements: ${(job.requirements || []).join("; ") || "N/A"}.\n\n` +
    `APPLICANTS:\n${list}\n\n` +
    `Return a JSON array, best fit first: ` +
    `[{"id":"<id>","score":<0-100>,"reason":"<short>"}]`;
  const out = await askJSON({ system, prompt, maxTokens: 900 });
  const rows = Array.isArray(out) ? out : out.applicants || [];
  return rows.map((r) => ({
    id: String(r.id),
    score: clampScore(r.score),
    reason: String(r.reason || "").slice(0, 200),
  }));
}

/* ------------------------------------------------------------------ */
/* 3) Generate a job description from a few employer inputs            */
/* ------------------------------------------------------------------ */
export async function generateJobDescription(input) {
  const system =
    "You are an expert HR copywriter for the Indian job market. Write clear, " +
    "inclusive, professional job posts. Respond with ONLY a JSON object.";
  const prompt =
    `Create a job posting from these inputs:\n` +
    `Title: ${input.title || "N/A"}\n` +
    `Company: ${input.company || "N/A"}\n` +
    `Category: ${input.category || "N/A"}\n` +
    `Location: ${input.location || "N/A"}\n` +
    `Type: ${input.jobType || "full-time"}\n` +
    `Notes/keywords: ${input.notes || "N/A"}\n\n` +
    `Return JSON: {"description": "<2-4 short paragraphs>", ` +
    `"requirements": ["<5-7 bullet points>"], "skills": ["<5-8 skills>"]}`;
  const out = await askJSON({ system, prompt, maxTokens: 1024 });
  return {
    description: String(out.description || "").slice(0, 4000),
    requirements: arr(out.requirements).slice(0, 12),
    skills: arr(out.skills).slice(0, 15),
  };
}

/* ------------------------------------------------------------------ */
/* 4) Parse pasted resume text into a structured profile              */
/* ------------------------------------------------------------------ */
export async function parseResume(resumeText) {
  const system =
    "You extract structured profile data from resume text. " +
    "Respond with ONLY a JSON object. Do not invent facts.";
  const prompt =
    `Extract profile fields from this resume text:\n"""${resumeText.slice(0, 6000)}"""\n\n` +
    `Return JSON: {"headline":"<role/title>","skills":["..."],` +
    `"experience":"<e.g. '3 years'>","location":"<city>","about":"<2-3 sentence summary>"}`;
  const out = await askJSON({ system, prompt, maxTokens: 700 });
  return {
    headline: String(out.headline || "").slice(0, 120),
    skills: arr(out.skills).slice(0, 20),
    experience: String(out.experience || "").slice(0, 60),
    location: String(out.location || "").slice(0, 80),
    about: String(out.about || "").slice(0, 600),
  };
}

/* ----------------------------- helpers ----------------------------- */
function clampScore(n) {
  const v = Math.round(Number(n));
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, v));
}
function arr(x) {
  if (!Array.isArray(x)) return [];
  return x.map((s) => String(s).trim()).filter(Boolean);
}
