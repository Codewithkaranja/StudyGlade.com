import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";

const router = express.Router();

// Registration & Login routes
router.post("/student-register", registerUser);
router.post("/student-login", loginUser);

export default router;
