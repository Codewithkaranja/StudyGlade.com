import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { createMessage, getMessages } from "../controllers/messageController.js";

const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
});
const upload = multer({ storage });

// Routes
// Get all messages for a specific assignment
router.get("/:assignmentId", protect, getMessages);

// Create a new message (with optional file attachment)
router.post("/", protect, upload.single("file"), createMessage);

export default router;
