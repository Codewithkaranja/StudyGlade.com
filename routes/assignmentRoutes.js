import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import { createAssignment, getAssignments, updateAssignment, attachFileToAssignment } from '../controllers/assignmentController.js';

const router = express.Router();

// Protect all assignment routes
router.use(protect);

// Multer setup for assignment attachments
const upload = multer({ dest: 'uploads/' });

// Assignment endpoints
router.post('/', createAssignment);
router.get('/', getAssignments);
router.put('/:id', updateAssignment);

// New route to attach file to an assignment
router.post('/upload-file', upload.single('file'), attachFileToAssignment);

export default router;
