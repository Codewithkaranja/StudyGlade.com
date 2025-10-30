import express from 'express';
import { getAssignments, updateAssignment, uploadAnswer, reportAssignment } from '../controllers/tutorController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Tutor assignment operations
router.get('/assignments', protect, getAssignments);
router.put('/assignments/:id', protect, updateAssignment);
router.post('/assignments/:id/upload-answer', protect, upload.single('answer'), uploadAnswer);
router.post('/assignments/:id/report', protect, reportAssignment);

export default router;
