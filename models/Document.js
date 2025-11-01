// models/Document.js
import mongoose from "mongoose";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/jpeg",
  "image/png",
];

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true, min: 0 },
    mimeType: {
      type: String,
      required: true,
      enum: ALLOWED_MIME_TYPES,
    },
    downloads: { type: Number, default: 0, min: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true }
);

// Indexes for faster search/filter
documentSchema.index({ category: 1, subject: 1, title: "text" });

export default mongoose.model("Document", documentSchema);
