import express from "express";
import { initiateMpesaPayment } from "../controllers/mpesaController.js";
import { mpesaCallback } from "../controllers/mpesaCallbackController.js";

const router = express.Router();

// POST /api/payments/mpesa
router.post("/mpesa", initiateMpesaPayment);

// POST /api/payments/mpesa/callback
router.post("/mpesa/callback", mpesaCallback);

export default router;
