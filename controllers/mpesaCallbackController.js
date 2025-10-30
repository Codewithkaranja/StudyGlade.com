import mongoose from "mongoose";

// ==============================
// 📘 M-Pesa Callback Controller
// ==============================

// ✅ 1. Define a schema (optional but helpful)
const mpesaTransactionSchema = new mongoose.Schema(
  {
    MerchantRequestID: String,
    CheckoutRequestID: String,
    ResultCode: Number,
    ResultDesc: String,
    Amount: Number,
    MpesaReceiptNumber: String,
    TransactionDate: String,
    PhoneNumber: String,
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

const MpesaTransaction =
  mongoose.models.MpesaTransaction ||
  mongoose.model("MpesaTransaction", mpesaTransactionSchema);

// ✅ 2. Handle Safaricom Callback
export const mpesaCallback = async (req, res) => {
  try {
    const body = req.body;

    console.log("📞 Callback Received from Safaricom:");
    console.log(JSON.stringify(body, null, 2));

    // ✅ Extract important fields safely
    const callback = body?.Body?.stkCallback;
    if (!callback) {
      return res.status(400).json({ message: "Invalid callback payload" });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    let amount, receipt, date, phone;

    if (CallbackMetadata?.Item) {
      CallbackMetadata.Item.forEach((item) => {
        switch (item.Name) {
          case "Amount":
            amount = item.Value;
            break;
          case "MpesaReceiptNumber":
            receipt = item.Value;
            break;
          case "TransactionDate":
            date = item.Value;
            break;
          case "PhoneNumber":
            phone = item.Value;
            break;
          default:
            break;
        }
      });
    }

    // ✅ Determine status
    const status = ResultCode === 0 ? "SUCCESS" : "FAILED";

    // ✅ Save to MongoDB
    const transaction = new MpesaTransaction({
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      Amount: amount,
      MpesaReceiptNumber: receipt,
      TransactionDate: date,
      PhoneNumber: phone,
      status,
    });

    await transaction.save();

    // ✅ Respond to Safaricom (must return 200)
    res.status(200).json({
      message: "Callback received and processed successfully.",
      status,
    });
  } catch (error) {
    console.error("❌ M-Pesa Callback Error:", error.message);
    res.status(500).json({ message: "Error processing callback", error: error.message });
  }
};
