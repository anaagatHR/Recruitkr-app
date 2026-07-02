/**
 * DEMO server — runs the full RecruitKR API with an in-memory MongoDB.
 * No MongoDB install or Atlas account needed. Auto-seeds demo data on start.
 * Data is NOT saved (resets every restart). Use this only for quick demos.
 *
 * Run with:  npm run demo
 */
import "dotenv/config";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import express from "express";
import cors from "cors";

import User from "./models/User.js";
import Job from "./models/Job.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";

async function seedDemoData() {
  const employer = await User.create({
    name: "Priya Sharma",
    email: "employer@recruitkr.com",
    password: "password123",
    role: "employer",
    phone: "+91 90019 65072",
    companyName: "TechNova Solutions",
    companyWebsite: "https://technova.example.com",
    companyAbout: "A fast-growing IT services company hiring across India.",
  });

  await User.create({
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
  });

  const jobs = [
    { title: "React Native Developer", company: "TechNova Solutions", location: "Bengaluru", jobType: "full-time", category: "IT", description: "Build and maintain cross-platform mobile apps using React Native. Work with a modern stack and a friendly team.", requirements: ["2+ years React Native", "REST APIs", "Git"], skills: ["React Native", "JavaScript", "Redux"], salaryMin: 600000, salaryMax: 1200000, experience: "2-4 years" },
    { title: "Staff Nurse", company: "CarePlus Hospital", location: "Mumbai", jobType: "full-time", category: "Healthcare", description: "Provide quality patient care in a multi-specialty hospital.", requirements: ["B.Sc Nursing", "Valid registration"], skills: ["Patient Care", "Emergency"], salaryMin: 300000, salaryMax: 500000, experience: "1-3 years" },
    { title: "Bank Relationship Manager", company: "FinServe Bank", location: "Delhi", jobType: "full-time", category: "Banking", description: "Manage client relationships and grow the bank's portfolio.", requirements: ["Graduate", "Sales experience"], skills: ["Sales", "Communication"], salaryMin: 400000, salaryMax: 700000, experience: "1-4 years" },
    { title: "Customer Support (Work From Home)", company: "ShopEasy Retail", location: "Remote", jobType: "remote", category: "Retail", description: "Handle customer queries over chat and email from home.", requirements: ["Good English", "Laptop & internet"], skills: ["Communication", "Typing"], salaryMin: 200000, salaryMax: 350000, experience: "0-2 years" },
    { title: "Warehouse Supervisor", company: "QuickMove Logistics", location: "Pune", jobType: "full-time", category: "Logistics", description: "Supervise warehouse operations and a team of workers.", requirements: ["Graduate", "Leadership"], skills: ["Operations", "Team Management"], salaryMin: 300000, salaryMax: 450000, experience: "2-5 years" },
    { title: "Digital Marketing Intern", company: "TechNova Solutions", location: "Bengaluru", jobType: "internship", category: "IT", description: "Assist the marketing team with social media and content.", requirements: ["Pursuing degree", "Creative"], skills: ["Social Media", "Canva"], salaryMin: 120000, salaryMax: 180000, experience: "0-1 years" },
    { title: "CNC Machine Operator", company: "PrecisionWorks Mfg", location: "Chennai", jobType: "full-time", category: "Manufacturing", description: "Operate and maintain CNC machines on the production floor.", requirements: ["ITI / Diploma", "Shift work"], skills: ["CNC", "Machining"], salaryMin: 250000, salaryMax: 400000, experience: "1-3 years" },
    { title: "Freelance Graphic Designer", company: "BrandCraft Studio", location: "Remote", jobType: "freelance", category: "IT", description: "Design logos, banners and social media creatives per project.", requirements: ["Portfolio", "Adobe Suite"], skills: ["Photoshop", "Illustrator"], experience: "1-3 years" },
  ];
  await Job.insertMany(jobs.map((j) => ({ ...j, postedBy: employer._id })));
}

async function main() {
  console.log("⏳ Starting in-memory MongoDB (first run downloads it, please wait)...");
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log("✅ In-memory MongoDB ready");

  await seedDemoData();
  console.log("✅ Demo data seeded");

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get("/", (req, res) => res.json({ name: "RecruitKR API (DEMO)", status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/applications", applicationRoutes);
  app.use((req, res) => res.status(404).json({ message: "Route not found" }));

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 RecruitKR DEMO API running on http://localhost:${PORT}`);
    console.log("Demo logins:");
    console.log("  Candidate -> candidate@recruitkr.com / password123");
    console.log("  Employer  -> employer@recruitkr.com / password123\n");
  });
}

main().catch((err) => {
  console.error("Demo server failed:", err);
  process.exit(1);
});
