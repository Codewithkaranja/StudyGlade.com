import Message from "../models/Message.js";

/**
 * @desc   Create a new message (with optional file attachment)
 * @route  POST /api/messages
 * @access Authenticated (student or tutor)
 */
export const createMessage = async (req, res) => {
  try {
    const { assignmentId, text } = req.body;
    const senderId = req.user?._id; // Must be authenticated

    if (!assignmentId) {
      return res.status(400).json({ message: "Assignment ID is required" });
    }

    if (!text && !req.file) {
      return res.status(400).json({
        message: "Message must contain text or a file attachment",
      });
    }

    // Handle attachment if present
    const attachments = [];
    if (req.file) {
      attachments.push({
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        type: req.file.mimetype,
        size: req.file.size,
      });
    }

    // Create and save message
    const message = await Message.create({
      assignmentId,
      senderId,
      text,
      attachments,
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Message creation error:", error);
    res.status(500).json({ message: "Error sending message" });
  }
};

/**
 * @desc   Get all messages for a specific assignment
 * @route  GET /api/messages/:assignmentId
 * @access Authenticated
 */
export const getMessages = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const messages = await Message.find({ assignmentId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email"); // optional: populate sender info

    res.status(200).json({
      message: "Messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
};
