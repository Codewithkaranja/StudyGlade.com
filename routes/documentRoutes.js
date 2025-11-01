import express from "express";
import multer from "multer";
import { uploadDocument, getDocuments, downloadDocument } from "../controllers/documentController.js";

const router = express.Router();

// ✅ Multer setup for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
});
const upload = multer({ storage });

// ✅ Routes (no protect middleware)
router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", getDocuments);
router.get("/download/:id", downloadDocument);

export default router;
