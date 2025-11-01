import express from 'express';
import multer from 'multer';
import { getAssignments, uploadAnswer, reportAssignment } from '../controllers/tutorController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// ✅ Simple Tutor Bypass Middleware
const tutorBypass = (req, res, next) => {
  const bypassKey = req.headers['x-tutor-key']; // custom header
  const validKey = process.env.TUTOR_BYPASS_KEY || 'studyglade-access-2025';

  if (bypassKey === validKey) {
    next(); // authorized
  } else {
    res.status(403).json({ message: 'Access denied: invalid tutor key' });
  }
};

// ✅ Protected Tutor Endpoints (with bypass)
router.use(tutorBypass);

router.get('/assignments', getAssignments);
router.post('/assignments/:id/upload-answer', upload.single('answer'), uploadAnswer);
router.post('/assignments/:id/report', reportAssignment);

export default router;
