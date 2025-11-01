import express from 'express';
import { registerUser } from '../controllers/authController.js';

const router = express.Router();

// Register user with email only
router.post('/register', registerUser);

// No login route needed for now
// router.post('/login', loginUser);

export default router;
