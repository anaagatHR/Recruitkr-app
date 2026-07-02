import Application from "../models/Application.js";
import Job from "../models/Job.js";

// POST /api/applications  (candidate applies to a job)
export async function apply(req, res) {
  try {
    const { jobId, coverNote } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const existing = await Application.findOne({ job: jobId, candidate: req.user._id });
    if (existing) {
      return res.status(409).json({ message: "You have already applied to this job" });
    }

    const application = await Application.create({
      job: job._id,
      candidate: req.user._id,
      employer: job.postedBy,
      coverNote,
      resumeUrl: req.user.resumeUrl,
    });

    res.status(201).json({ application });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// GET /api/applications/mine  (candidate's applications)
export async function myApplications(req, res) {
  try {
    const apps = await Application.find({ candidate: req.user._id })
      .populate("job", "title company location jobType category")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ applications: apps });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/applications/job/:jobId  (employer sees applicants for a job)
export async function jobApplicants(req, res) {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (String(job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only view applicants for your own jobs" });
    }
    const apps = await Application.find({ job: job._id })
      .populate("candidate", "name email phone headline skills experience location resumeUrl about")
      .sort({ createdAt: -1 })
      .limit(500);
    res.json({ applications: apps });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

const VALID_STATUSES = ["applied", "shortlisted", "rejected", "hired"];

// PUT /api/applications/:id/status  (employer updates status)
export async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (String(app.employer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    app.status = status;
    await app.save();
    res.json({ application: app });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
