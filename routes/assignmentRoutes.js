import express from 'express';
import multer from 'multer';
import {
  createAssignment,
  getAssignments,
  updateAssignment,
  attachFileToAssignment,
} from '../controllers/assignmentController.js';

const router = express.Router();

// ✅ Multer setup for assignment attachments
const upload = multer({ dest: 'uploads/' });

// ✅ Public routes — no protect middleware
router.post('/', createAssignment);
router.get('/', getAssignments);
router.put('/:id', updateAssignment);
router.post('/upload-file', upload.single('file'), attachFileToAssignment);

export default router;
