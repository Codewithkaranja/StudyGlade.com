// routes/reportRoute.js
import express from "express";
import { getReports, getAllReports, getLatestReport } from "../controllers/reportController.js";

const router = express.Router();

// ✅ Public report routes
// Fetch and save a new report snapshot
router.get("/", getReports);

// Fetch all historical reports
router.get("/all", getAllReports);

// Fetch only the latest report
router.get("/latest", getLatestReport);

export default router;
