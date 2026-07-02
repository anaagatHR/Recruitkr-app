import { Router } from "express";
import { getCompanies, getCompanyJobs } from "../controllers/jobController.js";

const router = Router();

router.get("/", getCompanies);
router.get("/:name/jobs", getCompanyJobs);

export default router;
