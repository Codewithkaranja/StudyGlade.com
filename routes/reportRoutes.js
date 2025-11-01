// routes/reportRoute.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getReports, getAllReports, getLatestReport } from "../controllers/reportController.js";

const router = express.Router();

// Protect all report routes
router.use(protect);

// GET /api/reports          -> Fetch and save a new report snapshot
router.get("/", getReports);

// GET /api/reports/all      -> Fetch all historical reports
router.get("/all", getAllReports);

// GET /api/reports/latest   -> Fetch only the latest report
router.get("/latest", getLatestReport);

export default router;
