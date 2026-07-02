import client from "./client";

// ---- Auth ----
export const authApi = {
  register: (data) => client.post("/auth/register", data).then((r) => r.data),
  login: (data) => client.post("/auth/login", data).then((r) => r.data),
  me: () => client.get("/auth/me").then((r) => r.data),
  updateMe: (data) => client.put("/auth/me", data).then((r) => r.data),
};

// ---- Jobs ----
export const jobsApi = {
  list: (params) => client.get("/jobs", { params }).then((r) => r.data),
  get: (id) => client.get(`/jobs/${id}`).then((r) => r.data),
  create: (data) => client.post("/jobs", data).then((r) => r.data),
  update: (id, data) => client.put(`/jobs/${id}`, data).then((r) => r.data),
  remove: (id) => client.delete(`/jobs/${id}`).then((r) => r.data),
  mine: () => client.get("/jobs/mine/list").then((r) => r.data),
};

// ---- Applications ----
export const applicationsApi = {
  // data: { jobId, applicantName, applicantEmail, applicantPhone, referenceSource, referenceName }
  apply: (data) => client.post("/applications", data).then((r) => r.data),
  mine: () => client.get("/applications/mine").then((r) => r.data),
  forJob: (jobId) => client.get(`/applications/job/${jobId}`).then((r) => r.data),
  setStatus: (id, status) =>
    client.put(`/applications/${id}/status`, { status }).then((r) => r.data),
};

// ---- Companies ----
export const companiesApi = {
  list: () => client.get("/companies").then((r) => r.data),
  jobs: (name) => client.get(`/companies/${encodeURIComponent(name)}/jobs`).then((r) => r.data),
};

// ---- AI (Claude-powered; degrades gracefully if the server has no key) ----
export const aiApi = {
  status: () => client.get("/ai/status").then((r) => r.data),
  recommend: () => client.get("/ai/recommend").then((r) => r.data),
  match: (jobId) => client.get(`/ai/match/${jobId}`).then((r) => r.data),
  parseResume: (text) => client.post("/ai/parse-resume", { text }).then((r) => r.data),
  generateJob: (data) => client.post("/ai/generate-job", data).then((r) => r.data),
  rankApplicants: (jobId) => client.get(`/ai/rank/${jobId}`).then((r) => r.data),
};
