import express from "express";
import multer from "multer";
import { createMessage, getMessages } from "../controllers/messageController.js";

const router = express.Router();

// ✅ Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
});
const upload = multer({ storage });

// ✅ Routes (no protect middleware)
router.get("/:assignmentId", getMessages);
router.post("/", upload.single("file"), createMessage);

export default router;
