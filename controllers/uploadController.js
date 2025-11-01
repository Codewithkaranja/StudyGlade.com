import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Ensure the uploads folder exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${sanitized}`);
  },
});

// ✅ Optional: file filter to restrict file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images, PDFs, and documents allowed."));
  }
};

// ✅ Upload middleware
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Max: 10MB
  fileFilter,
});

// ✅ Controller
export const uploadFile = [
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        url: fileUrl,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
      });
    } catch (error) {
      console.error("Upload error:", error.message);
      res.status(500).json({ success: false, message: "Error uploading file" });
    }
  },
];
