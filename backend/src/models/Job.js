import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },

    // full-time / part-time / remote / internship / freelance / gig
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "remote", "internship", "freelance", "gig"],
      default: "full-time",
    },

    // IT, Healthcare, Banking, Retail, Manufacturing, Logistics, etc.
    category: { type: String, required: true, trim: true },

    description: { type: String, required: true },
    requirements: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],

    salaryMin: { type: Number },
    salaryMax: { type: Number },
    experience: { type: String, trim: true }, // e.g. "0-2 years"

    // Who posted it (an employer User)
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text index for fast keyword search
jobSchema.index({ title: "text", company: "text", description: "text", category: "text" });

export default mongoose.model("Job", jobSchema);
