// controllers/reportController.js
import Assignment from "../models/Assignment.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Report from "../models/Report.js"; // Import the schema we just created

/**
 * @desc   Fetch summary reports and save snapshot
 * @route  GET /api/reports
 * @access Protected (admin or authorized)
 */
export const getReports = async (req, res) => {
  try {
    // 1️⃣ Fetch summary stats
    const totalUsers = await User.countDocuments();
    const totalAssignments = await Assignment.countDocuments();
    const totalPayments = await Payment.countDocuments();

    // 2️⃣ Fetch latest payments
    const latestPaymentsRaw = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email") // Optional: include user details
      .select("amount currency user createdAt");

    // 3️⃣ Map for report document
    const latestPayments = latestPaymentsRaw.map((p) => ({
      amount: p.amount,
      currency: p.currency,
      user: p.user?._id,
      createdAt: p.createdAt,
    }));

    // 4️⃣ Save report snapshot in DB
    const report = await Report.create({
      totalUsers,
      totalAssignments,
      totalPayments,
      latestPayments,
      generatedAt: new Date(),
    });

    // 5️⃣ Return response
    res.status(200).json({
      message: "Reports fetched and snapshot saved successfully",
      data: report,
    });
  } catch (error) {
    console.error("Report error:", error.message);
    res.status(500).json({ message: "Error fetching reports", error: error.message });
  }
};
// Fetch all historical reports
export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ generatedAt: -1 });
    res.status(200).json({ message: "All reports fetched successfully", data: reports });
  } catch (error) {
    console.error("Get all reports error:", error.message);
    res.status(500).json({ message: "Error fetching reports", error: error.message });
  }
};

// Fetch only the latest report
export const getLatestReport = async (req, res) => {
  try {
    const latest = await Report.findOne().sort({ generatedAt: -1 });
    if (!latest) return res.status(404).json({ message: "No reports found" });
    res.status(200).json({ message: "Latest report fetched successfully", data: latest });
  } catch (error) {
    console.error("Get latest report error:", error.message);
    res.status(500).json({ message: "Error fetching latest report", error: error.message });
  }
};
