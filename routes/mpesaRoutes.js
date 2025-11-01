import express from "express";
import { initiateMpesaPayment } from "../controllers/mpesaController.js";
import { mpesaCallback } from "../controllers/mpesaCallbackController.js";

const router = express.Router();

// ✅ Initiate payment request (user triggers this)
router.post("/mpesa", initiateMpesaPayment);

// ✅ M-Pesa callback endpoint (Safaricom calls this)
router.post("/mpesa/callback", mpesaCallback);

export default router;
