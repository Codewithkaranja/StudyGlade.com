import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import tutorRoutes from "./routes/tutorRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/documents", documentRoutes);

// Test route
app.get("/", (req, res) => res.send("✅ StudyGlade Backend Running"));

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
