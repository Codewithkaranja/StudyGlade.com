import Assignment from "../models/Assignment.js";
import path from "path";
import fs from "fs";

/**
 * @desc   Fetch all assignments (for tutors)
 * @route  GET /api/tutor/assignments
 * @access Tutor
 */
export const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, assignments });
  } catch (error) {
    console.error("Error fetching assignments:", error.message);
    res.status(500).json({ success: false, message: "Error fetching assignments" });
  }
};

/**
 * @desc   Update assignment details or status
 * @route  PUT /api/tutor/assignments/:id
 * @access Tutor
 */
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Assignment.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }
    res.status(200).json({ success: true, updated });
  } catch (error) {
    console.error("Error updating assignment:", error.message);
    res.status(500).json({ success: false, message: "Error updating assignment" });
  }
};

/**
 * @desc   Upload answer file for an assignment
 * @route  POST /api/tutor/assignments/:id/answer
 * @access Tutor
 */
export const uploadAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileUrl = `/uploads/${file.filename}`;

    const assignment = await Assignment.findByIdAndUpdate(
      id,
      {
        status: "completed",
        answer_url: fileUrl,
      },
      { new: true }
    );

    if (!assignment) {
      // Delete uploaded file if assignment not found
      fs.unlinkSync(path.join("uploads", file.filename));
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    res.status(200).json({
      success: true,
      message: "Answer uploaded successfully",
      fileUrl,
    });
  } catch (error) {
    console.error("Error uploading answer:", error.message);
    res.status(500).json({ success: false, message: "Error uploading answer" });
  }
};

/**
 * @desc   Report a disputed assignment
 * @route  POST /api/tutor/assignments/:id/report
 * @access Tutor
 */
export const reportAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Reason is required" });
    }

    const assignment = await Assignment.findByIdAndUpdate(
      id,
      {
        status: "dispute",
        dispute_reason: reason,
      },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    res.status(200).json({
      success: true,
      message: "Assignment reported successfully",
      assignment,
    });
  } catch (error) {
    console.error("Error reporting assignment:", error.message);
    res.status(500).json({ success: false, message: "Error reporting assignment" });
  }
};
