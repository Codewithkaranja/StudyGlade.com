import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

export const uploadFile = [
  upload.single("file"),
  (req, res) => {
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  },
];
