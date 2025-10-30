import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getReports } from "../controllers/reportController.js";

const router = express.Router();

router.use(protect);

// GET all reports
router.get("/", getReports);

// ✅ Default export
export default router;
