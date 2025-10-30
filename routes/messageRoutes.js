import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendMessage, getMessages } from "../controllers/messageController.js";

const router = express.Router();

// Protect all message routes
router.use(protect);

// Message endpoints
router.post("/", sendMessage);
router.get("/:assignmentId", getMessages);

export default router;
