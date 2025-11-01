import express from 'express';
import multer from 'multer';
import {
  createAssignment,
  getAssignments,
  updateAssignment,
  attachFileToAssignment,
} from '../controllers/assignmentController.js';

const router = express.Router();

// Multer setup for handling assignment file uploads
const upload = multer({ dest: 'uploads/' });

// PUBLIC ROUTES — No authentication middleware
router.post('/', createAssignment); // Create a new assignment
router.get('/', getAssignments); // Get all assignments
router.put('/:id', updateAssignment); // Update an assignment by ID
router.post('/upload-file', upload.single('file'), attachFileToAssignment); // Attach a file to an assignment

export default router;
