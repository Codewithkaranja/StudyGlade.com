import Document from "../models/Document.js";
import fs from "fs";
import path from "path";

// ---------- Upload Document ----------
export const uploadDocument = async (req, res) => {
  try {
    const { title, category, subject } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    const newDoc = new Document({
      title,
      category: category || "other",
      subject: subject || "general",
      fileUrl,
      fileName,
      fileSize,
      mimeType,
    });

    await newDoc.save();

    res.status(201).json({
      message: "Document uploaded successfully",
      document: newDoc,
    });
  } catch (error) {
    console.error("Upload Document Error:", error);
    res.status(500).json({ message: "Error uploading document", error: error.message });
  }
};

// ---------- Get Documents ----------
export const getDocuments = async (req, res) => {
  try {
    const { category, subject, search } = req.query;
    let filter = {};

    if (category) filter.category = category;
    if (subject) filter.subject = subject;
    if (search) filter.title = { $regex: search, $options: "i" };

    const documents = await Document.find(filter).sort({ createdAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    console.error("Get Documents Error:", error);
    res.status(500).json({ message: "Error fetching documents", error: error.message });
  }
};

// ---------- Download Document ----------
export const downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const filePath = path.resolve(`.${doc.fileUrl}`);

    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      console.warn(`File missing on disk: ${filePath}`);
      return res.status(404).json({ message: "File not found on server" });
    }

    // Increment downloads safely
    doc.downloads = (doc.downloads || 0) + 1;
    await doc.save();

    res.download(filePath, doc.fileName, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error downloading file", error: err.message });
        }
      }
    });
  } catch (error) {
    console.error("Download Document Error:", error);
    res.status(500).json({ message: "Error downloading document", error: error.message });
  }
};
