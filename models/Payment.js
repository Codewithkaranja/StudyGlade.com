import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    stripePaymentId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
