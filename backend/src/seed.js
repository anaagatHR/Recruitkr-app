import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Job from "./models/Job.js";
import Application from "./models/Application.js";
import { demoEmployer, demoCandidate, demoJobs } from "./seedData.js";

/**
 * Manually wipes and re-seeds the database with demo data.
 * Run with:  npm run seed
 */
async function seed() {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([User.deleteMany({}), Job.deleteMany({}), Application.deleteMany({})]);

  console.log("Creating demo users...");
  const employer = await User.create(demoEmployer);
  await User.create(demoCandidate);

  console.log("Creating sample jobs...");
  await Job.insertMany(demoJobs.map((j) => ({ ...j, postedBy: employer._id })));

  console.log("\n✅ Seed complete!");
  console.log("Demo logins:");
  console.log("  Candidate -> candidate@recruitkr.com / password123");
  console.log("  Employer  -> employer@recruitkr.com / password123");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
