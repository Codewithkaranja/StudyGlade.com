import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import { getAssignments, uploadAnswer, reportAssignment } from '../controllers/tutorController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Tutor operations
router.use(protect);

router.get('/assignments', getAssignments);
router.post('/assignments/:id/upload-answer', upload.single('answer'), uploadAnswer);
router.post('/assignments/:id/report', reportAssignment);

export default router;
