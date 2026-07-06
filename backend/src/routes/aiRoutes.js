import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  aiStatus,
  recommendJobs,
  matchJob,
  generateJob,
  resumeToProfile,
  rankJobApplicants,
  chat,
} from "../controllers/aiController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = Router();

// AI calls cost money and time — cap them per IP to prevent abuse.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many AI requests. Please wait a moment." },
});

router.get("/status", aiStatus);

// Candidate features
router.get("/recommend", protect, restrictTo("candidate"), aiLimiter, recommendJobs);
router.get("/match/:jobId", protect, restrictTo("candidate"), aiLimiter, matchJob);
router.post("/parse-resume", protect, restrictTo("candidate"), aiLimiter, resumeToProfile);
router.post("/chat", protect, restrictTo("candidate"), aiLimiter, chat);

// Employer features
router.post("/generate-job", protect, restrictTo("employer"), aiLimiter, generateJob);
router.get("/rank/:jobId", protect, restrictTo("employer"), aiLimiter, rankJobApplicants);

export default router;
