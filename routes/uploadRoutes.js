import express from "express";
import { uploadFile } from "../controllers/uploadController.js";

const router = express.Router();

// ✅ No protection needed (public upload for now)
router.post("/", uploadFile);

export default router;
