import Job from "../models/Job.js";
import Application from "../models/Application.js";

// Only these fields may be set by a client (prevents mass-assignment of postedBy etc.)
const JOB_FIELDS = [
  "title", "company", "location", "jobType", "category", "description",
  "requirements", "skills", "salaryMin", "salaryMax", "experience",
];
function pickJobFields(body) {
  const out = {};
  for (const k of JOB_FIELDS) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

// GET /api/jobs?search=&category=&jobType=&location=&minSalary=&postedWithin=&sort=&page=
export async function getJobs(req, res) {
  try {
    const {
      search, category, jobType, location,
      minSalary, postedWithin, sort = "newest",
      page = 1, limit = 20,
    } = req.query;
    const filter = { isActive: true };

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (jobType) filter.jobType = jobType;
    if (location) filter.location = new RegExp(location, "i");

    // Salary filter: jobs whose max (or min) is at least minSalary
    if (minSalary) {
      const m = Number(minSalary);
      if (!Number.isNaN(m)) filter.salaryMax = { $gte: m };
    }

    // Posted-within filter: "1" / "3" / "7" / "30" days
    if (postedWithin) {
      const days = Number(postedWithin);
      if (!Number.isNaN(days) && days > 0) {
        filter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
      }
    }

    // Sort options
    let sortSpec = { createdAt: -1 }; // newest (default)
    if (sort === "salary") sortSpec = { salaryMax: -1, createdAt: -1 };
    else if (sort === "oldest") sortSpec = { createdAt: 1 };

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * safeLimit;

    const [jobsRaw, total] = await Promise.all([
      Job.find(filter).sort(sortSpec).skip(skip).limit(safeLimit).lean(),
      Job.countDocuments(filter),
    ]);

    // Attach applicant counts (Indeed-style "X applicants")
    const jobs = await Promise.all(
      jobsRaw.map(async (j) => ({
        ...j,
        applicantCount: await Application.countDocuments({ job: j._id }),
      }))
    );

    res.json({ jobs, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/companies  — list distinct companies with job counts
export async function getCompanies(req, res) {
  try {
    const companies = await Job.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$company",
          jobCount: { $sum: 1 },
          categories: { $addToSet: "$category" },
          locations: { $addToSet: "$location" },
        },
      },
      { $sort: { jobCount: -1 } },
      { $limit: 100 },
    ]);
    res.json({
      companies: companies.map((c) => ({
        name: c._id,
        jobCount: c.jobCount,
        categories: c.categories,
        locations: c.locations,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/companies/:name/jobs  — all active jobs for a company
export async function getCompanyJobs(req, res) {
  try {
    const name = decodeURIComponent(req.params.name);
    const jobs = await Job.find({ company: name, isActive: true }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ company: name, jobs, total: jobs.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/jobs/:id
export async function getJob(req, res) {
  try {
    const job = await Job.findById(req.params.id).populate("postedBy", "name companyName email");
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// POST /api/jobs  (employer only)
export async function createJob(req, res) {
  try {
    const fields = pickJobFields(req.body);
    const job = await Job.create({
      ...fields,
      company: fields.company || req.user.companyName || req.user.name,
      postedBy: req.user._id,
    });
    res.status(201).json({ job });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// PUT /api/jobs/:id  (owner employer only)
export async function updateJob(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (String(job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only edit your own jobs" });
    }
    Object.assign(job, pickJobFields(req.body));
    await job.save();
    res.json({ job });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// DELETE /api/jobs/:id  (owner employer only)
export async function deleteJob(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (String(job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own jobs" });
    }
    await job.deleteOne();
    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/jobs/mine/list  (employer's own jobs, with applicant counts)
export async function getMyJobs(req, res) {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 }).lean();
    const withCounts = await Promise.all(
      jobs.map(async (j) => ({
        ...j,
        applicantCount: await Application.countDocuments({ job: j._id }),
      }))
    );
    res.json({ jobs: withCounts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
