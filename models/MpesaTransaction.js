import mongoose from "mongoose";

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

export default mongoose.models.MpesaTransaction ||
  mongoose.model("MpesaTransaction", mpesaTransactionSchema);
