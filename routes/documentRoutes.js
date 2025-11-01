import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import { uploadDocument, getDocuments, downloadDocument } from "../controllers/documentController.js";

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
});
const upload = multer({ storage });

// Routes
router.post("/documents/upload", protect, upload.single("file"), uploadDocument);
router.get("/documents", getDocuments);
router.get("/documents/download/:id", downloadDocument);

export default router;
