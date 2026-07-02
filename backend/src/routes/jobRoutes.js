import { Router } from "express";
import {
  getJobs, getJob, createJob, updateJob, deleteJob, getMyJobs,
} from "../controllers/jobController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = Router();

router.get("/", getJobs);
router.get("/mine/list", protect, restrictTo("employer"), getMyJobs);
router.get("/:id", getJob);
router.post("/", protect, restrictTo("employer"), createJob);
router.put("/:id", protect, restrictTo("employer"), updateJob);
router.delete("/:id", protect, restrictTo("employer"), deleteJob);

export default router;
