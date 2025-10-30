import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createAssignment, getAssignments } from "../controllers/assignmentController.js";

const router = express.Router();

// Protect all assignment routes
router.use(protect);

// Assignment endpoints
router.post("/", createAssignment);
router.get("/", getAssignments);

export default router;
