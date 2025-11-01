// models/Report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    totalUsers: { type: Number, default: 0 },
    totalAssignments: { type: Number, default: 0 },
    totalPayments: { type: Number, default: 0 },
    latestPayments: [
      {
        amount: { type: Number },
        currency: { type: String, default: "usd" },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    generatedAt: { type: Date, default: Date.now }, // Timestamp when report was generated
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
