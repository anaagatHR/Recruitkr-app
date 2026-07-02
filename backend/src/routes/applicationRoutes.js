import { Router } from "express";
import {
  apply, myApplications, jobApplicants, updateStatus,
} from "../controllers/applicationController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = Router();

router.post("/", protect, restrictTo("candidate"), apply);
router.get("/mine", protect, restrictTo("candidate"), myApplications);
router.get("/job/:jobId", protect, restrictTo("employer"), jobApplicants);
router.put("/:id/status", protect, restrictTo("employer"), updateStatus);

export default router;
