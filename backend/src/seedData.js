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
 * Jobs & internships for Jaipur and Kota (Rajasthan). Added on every server
 * start if they don't already exist (matched by title + company + location).
 */
export const rajasthanJobs = [
  // ---- Jaipur, Rajasthan ----
  { title: "Sales Executive", company: "Pink City Retail", location: "Jaipur, Rajasthan", jobType: "full-time", category: "Retail", description: "Drive in-store sales and assist customers at our Jaipur showroom. Attractive incentives on targets.", requirements: ["12th pass or graduate", "Good communication in Hindi"], skills: ["Sales", "Customer Service"], salaryMin: 180000, salaryMax: 300000, experience: "0-2 years" },
  { title: "Customer Support Executive", company: "RajTech BPO", location: "Jaipur, Rajasthan", jobType: "full-time", category: "IT", description: "Handle customer calls and chat support for our clients. Day shift, Jaipur office.", requirements: ["Good Hindi & basic English", "Computer basics"], skills: ["Communication", "Typing"], salaryMin: 200000, salaryMax: 320000, experience: "0-2 years" },
  { title: "Accountant", company: "Marwar Traders", location: "Jaipur, Rajasthan", jobType: "full-time", category: "Banking", description: "Maintain daily accounts, GST filing and Tally entries for a growing trading firm.", requirements: ["B.Com", "Tally & Excel"], skills: ["Tally", "GST", "Excel"], salaryMin: 240000, salaryMax: 400000, experience: "1-4 years" },
  { title: "Digital Marketing Executive", company: "JaipurWeb Solutions", location: "Jaipur, Rajasthan", jobType: "full-time", category: "IT", description: "Run social media, ads and SEO for local businesses in Jaipur.", requirements: ["Graduate", "Knowledge of Instagram/Facebook ads"], skills: ["SEO", "Social Media", "Canva"], salaryMin: 220000, salaryMax: 420000, experience: "0-3 years" },
  { title: "Delivery Partner", company: "QuickBite Foods", location: "Jaipur, Rajasthan", jobType: "part-time", category: "Logistics", description: "Deliver food orders across Jaipur. Flexible hours, weekly payouts.", requirements: ["Own two-wheeler", "Smartphone", "Valid DL"], skills: ["Driving", "Time Management"], salaryMin: 150000, salaryMax: 300000, experience: "0-1 years" },
  { title: "Web Development Intern", company: "JaipurWeb Solutions", location: "Jaipur, Rajasthan", jobType: "internship", category: "IT", description: "Learn and build real websites using HTML, CSS and JavaScript with our senior team. Certificate + stipend.", requirements: ["Pursuing / completed graduation", "Basic HTML/CSS"], skills: ["HTML", "CSS", "JavaScript"], salaryMin: 60000, salaryMax: 120000, experience: "0-1 years" },
  { title: "Graphic Design Intern", company: "Pink City Media", location: "Jaipur, Rajasthan", jobType: "internship", category: "IT", description: "Assist the design team in creating social media posts and banners. Great portfolio-building opportunity.", requirements: ["Creative mindset", "Basic Photoshop/Canva"], skills: ["Photoshop", "Canva", "Design"], salaryMin: 50000, salaryMax: 100000, experience: "0-1 years" },

  // ---- Kota, Rajasthan ----
  { title: "Physics Faculty", company: "Kota Excellence Academy", location: "Kota, Rajasthan", jobType: "full-time", category: "IT", description: "Teach Physics to JEE/NEET aspirants at a reputed Kota coaching institute.", requirements: ["M.Sc / B.Tech", "Strong concepts", "Teaching passion"], skills: ["Physics", "Teaching"], salaryMin: 400000, salaryMax: 900000, experience: "1-5 years" },
  { title: "Front Office Executive", company: "Kota Grand Hotel", location: "Kota, Rajasthan", jobType: "full-time", category: "Retail", description: "Manage front desk, guest check-in/out and phone enquiries at our hotel.", requirements: ["Graduate", "Presentable", "Good communication"], skills: ["Customer Service", "Communication"], salaryMin: 180000, salaryMax: 300000, experience: "0-3 years" },
  { title: "Lab Technician", company: "Kota City Hospital", location: "Kota, Rajasthan", jobType: "full-time", category: "Healthcare", description: "Run diagnostic tests and manage lab samples in a busy hospital.", requirements: ["DMLT / B.Sc", "Lab experience preferred"], skills: ["Lab Testing", "Patient Care"], salaryMin: 200000, salaryMax: 350000, experience: "0-3 years" },
  { title: "Content Writer", company: "EduKota Online", location: "Kota, Rajasthan", jobType: "full-time", category: "IT", description: "Write study notes, blogs and question solutions for an ed-tech platform.", requirements: ["Graduate", "Good English writing"], skills: ["Writing", "Research"], salaryMin: 220000, salaryMax: 380000, experience: "0-2 years" },
  { title: "Teaching Intern (Maths)", company: "Kota Excellence Academy", location: "Kota, Rajasthan", jobType: "internship", category: "IT", description: "Support senior faculty, help students with doubts and prepare practice material. Stipend + certificate.", requirements: ["B.Sc/B.Tech ongoing or done", "Strong in Maths"], skills: ["Maths", "Teaching"], salaryMin: 80000, salaryMax: 150000, experience: "0-1 years" },
  { title: "Digital Marketing Intern", company: "EduKota Online", location: "Kota, Rajasthan", jobType: "internship", category: "IT", description: "Learn digital marketing hands-on — social media, ads and content for an ed-tech brand.", requirements: ["Pursuing degree", "Active on social media"], skills: ["Social Media", "Marketing", "Canva"], salaryMin: 60000, salaryMax: 120000, experience: "0-1 years" },
];

/**
 * Seeds demo users + jobs ONLY if the database has no jobs yet.
 * Safe to run on every server start.
 */
export async function autoSeedIfEmpty() {
  try {
    // Always ensure the demo employer exists (jobs are posted under it).
    let employer = await User.findOne({ email: demoEmployer.email });
    if (!employer) employer = await User.create(demoEmployer);

    const jobCount = await Job.countDocuments();
    if (jobCount === 0) {
      console.log("No jobs found — seeding demo data...");
      const candidateExists = await User.findOne({ email: demoCandidate.email });
      if (!candidateExists) await User.create(demoCandidate);
      await Job.insertMany(demoJobs.map((j) => ({ ...j, postedBy: employer._id })));
      console.log("✅ Demo data seeded (jobs + demo users ensured)");
    }

    // Additively ensure the Jaipur/Kota jobs exist (even on a non-empty DB).
    await ensureJobs(rajasthanJobs, employer._id);
  } catch (err) {
    console.error("Auto-seed failed:", err.message);
  }
}

/**
 * Insert any jobs from `list` that aren't already in the DB, matched by
 * title + company + location. Idempotent — safe to run on every start.
 */
async function ensureJobs(list, postedBy) {
  let added = 0;
  for (const j of list) {
    const exists = await Job.findOne({ title: j.title, company: j.company, location: j.location });
    if (!exists) {
      await Job.create({ ...j, postedBy });
      added++;
    }
  }
  if (added > 0) console.log(`✅ Added ${added} new Rajasthan job(s)/internship(s)`);
}
