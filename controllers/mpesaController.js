import axios from "axios";

/**
 * ===========================================
 *  M-PESA STK Push Controller (Refined)
 * ===========================================
 */
export const initiateMpesaPayment = async (req, res) => {
  try {
    const { phone, amount, assignmentId } = req.body;

    // ✅ Basic validation
    if (!phone || !amount) {
      return res.status(400).json({ message: "Phone number and amount are required." });
    }

    // ✅ Load credentials from .env
    const {
      MPESA_CONSUMER_KEY,
      MPESA_CONSUMER_SECRET,
      MPESA_SHORTCODE,
      MPESA_PASSKEY,
      MPESA_CALLBACK_URL,
      NODE_ENV
    } = process.env;

    // ✅ M-Pesa API Base URL (auto switch for production)
    const baseURL =
      NODE_ENV === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    // ✅ Get OAuth token
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");

    const { data: tokenResponse } = await axios.get(
      `${baseURL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const accessToken = tokenResponse.access_token;

    // ✅ Timestamp + Password
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:\.Z]/g, "")
      .slice(0, 14);

    const password = Buffer.from(MPESA_SHORTCODE + MPESA_PASSKEY + timestamp).toString("base64");

    // ✅ Format phone to 254 format
    const formattedPhone = phone.startsWith("254")
      ? phone
      : `254${phone.replace(/^0/, "")}`;

    // ✅ STK Push Payload
    const stkPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: `STUDYGLADE_${assignmentId || "GEN"}`,
      TransactionDesc: "StudyGlade Assignment Payment",
    };

    // ✅ Send STK Push request
    const { data: stkResponse } = await axios.post(
      `${baseURL}/mpesa/stkpush/v1/processrequest`,
      stkPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Return clean response
    return res.status(200).json({
      message: "✅ M-Pesa STK Push initiated successfully.",
      MerchantRequestID: stkResponse.MerchantRequestID,
      CheckoutRequestID: stkResponse.CheckoutRequestID,
      CustomerMessage: stkResponse.CustomerMessage,
    });
  } catch (error) {
    console.error("❌ M-Pesa error:", error.response?.data || error.message);

    return res.status(500).json({
      message: "Failed to initiate M-Pesa payment.",
      error: error.response?.data || error.message,
    });
  }
};
