import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },

    // "candidate" or "employer"
    role: {
      type: String,
      enum: ["candidate", "employer"],
      required: true,
      default: "candidate",
    },

    // Profile photo (Cloudinary URL) — used for both candidates and employers.
    photoUrl: { type: String, trim: true },

    // Candidate-specific
    headline: { type: String, trim: true }, // e.g. "Frontend Developer"
    skills: [{ type: String, trim: true }],
    experience: { type: String, trim: true }, // e.g. "2 years"
    location: { type: String, trim: true },
    resumeUrl: { type: String, trim: true },
    about: { type: String, trim: true },

    // Employer-specific
    companyName: { type: String, trim: true },
    companyWebsite: { type: String, trim: true },
    companyAbout: { type: String, trim: true },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Never send the password back to the client
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", userSchema);
