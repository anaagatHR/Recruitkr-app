import axios from "axios";
import Constants from "expo-constants";

/**
 * Client for the admin panel's public API (Recruitkr-Business).
 *
 * This is a SECOND backend, separate from `client.js` (recruitkr-api). Right now
 * only the apply flow talks to it: every application is mirrored here so it lands
 * in the admin panel's DB and fires its real-time notification, while the primary
 * record still goes to recruitkr-api (which is what My Applications, the
 * duplicate-apply check and the employer screens read from).
 *
 * The base URL is never hardcoded. It is resolved from, in order:
 *   1. app.json  -> expo.extra.businessApiUrl        (used by built APKs)
 *   2. .env      -> EXPO_PUBLIC_BUSINESS_API_URL     (local override)
 * If neither is set, `BUSINESS_API_READY` is false and every call here becomes a
 * no-op — the app keeps working exactly as before. That doubles as a kill switch.
 */
export const BUSINESS_API_BASE_URL =
  Constants.expoConfig?.extra?.businessApiUrl ||
  process.env.EXPO_PUBLIC_BUSINESS_API_URL ||
  "";

export const BUSINESS_API_READY = BUSINESS_API_BASE_URL.length > 0;

const businessClient = axios.create({
  baseURL: BUSINESS_API_BASE_URL,
  // Same reasoning as client.js: a free Render instance can take ~30-50s to wake.
  timeout: 60000,
});

businessClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.code === "ECONNABORTED" || error.message === "Network Error") {
      const e = new Error("Admin panel is waking up — the application was still saved.");
      e.isNetwork = true;
      return Promise.reject(e);
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      "Admin panel request failed.";
    const e = new Error(message);
    e.status = error.response?.status;
    return Promise.reject(e);
  }
);

/** "2 years" / "2-3 yrs" / "fresher" -> a number the admin panel can store. */
function parseYears(experience) {
  const match = String(experience || "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

/**
 * The app stores `resumeUrl` as a JSON blob {name, uri, size} where `uri` is a
 * LOCAL device path (file:///...) that no server can fetch. Only pass it on when
 * it is a real hosted URL, otherwise send "" rather than a broken link.
 */
function hostedResumeUrl(user) {
  const raw = user?.resumeUrl;
  if (!raw) return "";
  const isHttp = (v) => typeof v === "string" && /^https?:\/\//i.test(v);
  try {
    const parsed = JSON.parse(raw);
    return isHttp(parsed?.uri) ? parsed.uri : "";
  } catch (e) {
    // Legacy plain-string URL
    return isHttp(raw) ? raw : "";
  }
}

/**
 * Map the app's apply form + profile onto the admin panel's expected body.
 *
 * @param {object} opts
 * @param {object} opts.user     logged-in user (profile fallbacks)
 * @param {object} opts.job      the job being applied to
 * @param {object} opts.details  what ApplyModal collected
 */
export function toApplyBody({ user, job, details = {} }) {
  // The admin panel has no field for "how did you hear about us" / referrer, so
  // fold it into the cover note instead of dropping the answer on the floor.
  const notes = [];
  if (details.cover?.trim()) notes.push(details.cover.trim());
  if (details.referenceSource) notes.push(`Heard about us via: ${details.referenceSource}`);
  if (details.referenceName?.trim()) notes.push(`Referred by: ${details.referenceName.trim()}`);

  return {
    name: details.applicantName || user?.name || "",
    email: details.applicantEmail || user?.email || "",
    mobile: details.applicantPhone || user?.phone || "",
    qualification: details.qualification || user?.headline || "",
    experience_years: parseYears(user?.experience),
    skills: user?.skills || [],
    location: user?.location || "",
    resume_url: hostedResumeUrl(user),
    job_id: String(job?._id || ""),
    job_title: job?.title || "",
    cover: notes.join("\n"),
  };
}

export const businessApi = {
  /** POST /apply — creates the candidate + application in the admin panel. */
  apply: (body) => {
    if (!BUSINESS_API_READY) return Promise.resolve({ skipped: true });
    return businessClient.post("/apply", body).then((r) => r.data);
  },

  /** GET /jobs — open postings straight from the admin panel DB. Not wired into
   *  any screen yet; the job list still comes from recruitkr-api. */
  jobs: () => {
    if (!BUSINESS_API_READY) return Promise.resolve({ jobs: [] });
    return businessClient.get("/jobs").then((r) => r.data);
  },

  /** GET /application-status — single application lookup by email or id. */
  applicationStatus: ({ email = "", applicationId = "" } = {}) => {
    if (!BUSINESS_API_READY) return Promise.resolve(null);
    return businessClient
      .get("/application-status", { params: { email, application_id: applicationId } })
      .then((r) => r.data);
  },
};

export default businessClient;
