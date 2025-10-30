import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: Number,
    currency: { type: String, default: "usd" },
    status: { type: String, default: "pending" },
    stripePaymentId: String,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
