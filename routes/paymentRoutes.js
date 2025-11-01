import express from "express";
import { createPaymentIntent } from "../controllers/paymentController.js";

const router = express.Router();

// ✅ Public route for creating payment intents
router.post("/create-intent", createPaymentIntent);

export default router;
