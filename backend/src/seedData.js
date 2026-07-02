import User from "./models/User.js";
import Job from "./models/Job.js";

/**
 * Demo data used to seed an empty database.
 * Shared by seed.js (manual) and server.js (auto-seed on first deploy).
 */
export const demoEmployer = {
  name: "Priya Sharma",
  email: "employer@recruitkr.com",
  password: "password123",
  role: "employer",
  phone: "+91 90019 65072",
  companyName: "TechNova Solutions",
  companyWebsite: "https://technova.example.com",
  companyAbout: "A fast-growing IT services company hiring across India.",
};

export const demoCandidate = {
  name: "Amit Kumar",
  email: "candidate@recruitkr.com",
  password: "password123",
  role: "candidate",
  phone: "+91 96363 15150",
  headline: "Frontend Developer",
  skills: ["React", "JavaScript", "CSS", "React Native"],
  experience: "2 years",
  location: "Bengaluru",
  about: "Passionate frontend developer looking for new opportunities.",
};

export const demoJobs = [
  { title: "React Native Developer", company: "TechNova Solutions", location: "Bengaluru", jobType: "full-time", category: "IT", description: "Build and maintain cross-platform mobile apps using React Native. Work with a modern stack and a friendly team.", requirements: ["2+ years React Native", "REST APIs", "Git"], skills: ["React Native", "JavaScript", "Redux"], salaryMin: 600000, salaryMax: 1200000, experience: "2-4 years" },
  { title: "Staff Nurse", company: "CarePlus Hospital", location: "Mumbai", jobType: "full-time", category: "Healthcare", description: "Provide quality patient care in a multi-specialty hospital.", requirements: ["B.Sc Nursing", "Valid registration"], skills: ["Patient Care", "Emergency"], salaryMin: 300000, salaryMax: 500000, experience: "1-3 years" },
  { title: "Bank Relationship Manager", company: "FinServe Bank", location: "Delhi", jobType: "full-time", category: "Banking", description: "Manage client relationships and grow the bank's portfolio.", requirements: ["Graduate", "Sales experience"], skills: ["Sales", "Communication"], salaryMin: 400000, salaryMax: 700000, experience: "1-4 years" },
  { title: "Customer Support (Work From Home)", company: "ShopEasy Retail", location: "Remote", jobType: "remote", category: "Retail", description: "Handle customer queries over chat and email from home.", requirements: ["Good English", "Laptop & internet"], skills: ["Communication", "Typing"], salaryMin: 200000, salaryMax: 350000, experience: "0-2 years" },
  { title: "Warehouse Supervisor", company: "QuickMove Logistics", location: "Pune", jobType: "full-time", category: "Logistics", description: "Supervise warehouse operations and a team of workers.", requirements: ["Graduate", "Leadership"], skills: ["Operations", "Team Management"], salaryMin: 300000, salaryMax: 450000, experience: "2-5 years" },
  { title: "Digital Marketing Intern", company: "TechNova Solutions", location: "Bengaluru", jobType: "internship", category: "IT", description: "Assist the marketing team with social media and content.", requirements: ["Pursuing degree", "Creative"], skills: ["Social Media", "Canva"], salaryMin: 120000, salaryMax: 180000, experience: "0-1 years" },
  { title: "CNC Machine Operator", company: "PrecisionWorks Mfg", location: "Chennai", jobType: "full-time", category: "Manufacturing", description: "Operate and maintain CNC machines on the production floor.", requirements: ["ITI / Diploma", "Shift work"], skills: ["CNC", "Machining"], salaryMin: 250000, salaryMax: 400000, experience: "1-3 years" },
  { title: "Freelance Graphic Designer", company: "BrandCraft Studio", location: "Remote", jobType: "freelance", category: "IT", description: "Design logos, banners and social media creatives per project.", requirements: ["Portfolio", "Adobe Suite"], skills: ["Photoshop", "Illustrator"], experience: "1-3 years" },
];

/**
 * Seeds demo users + jobs ONLY if the database has no jobs yet.
 * Safe to run on every server start.
 */
export async function autoSeedIfEmpty() {
  try {
    const jobCount = await Job.countDocuments();
    if (jobCount > 0) return; // already has jobs, do nothing

    console.log("No jobs found — seeding demo data...");

    // Find-or-create the demo employer (resilient to partial/leftover data)
    let employer = await User.findOne({ email: demoEmployer.email });
    if (!employer) employer = await User.create(demoEmployer);

    // Find-or-create the demo candidate
    const candidateExists = await User.findOne({ email: demoCandidate.email });
    if (!candidateExists) await User.create(demoCandidate);

    await Job.insertMany(demoJobs.map((j) => ({ ...j, postedBy: employer._id })));
    console.log("✅ Demo data seeded (jobs + demo users ensured)");
  } catch (err) {
    console.error("Auto-seed failed:", err.message);
  }
}
