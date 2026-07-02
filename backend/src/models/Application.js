import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Details captured on the apply form (so employers always get these 4,
    // even if the candidate never filled a full profile).
    applicantName: { type: String, trim: true },
    applicantEmail: { type: String, trim: true },
    applicantPhone: { type: String, trim: true },

    // "How did you hear about us?" + who referred them (optional).
    referenceSource: { type: String, trim: true }, // e.g. WhatsApp, Facebook, Friend
    referenceName: { type: String, trim: true },    // person who referred, if any

    coverNote: { type: String, trim: true },
    resumeUrl: { type: String, trim: true },

    // applied -> shortlisted -> rejected / hired
    status: {
      type: String,
      enum: ["applied", "shortlisted", "rejected", "hired"],
      default: "applied",
    },
  },
  { timestamps: true }
);

// A candidate can apply to a given job only once
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
