import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String },
  size: { type: Number } // optional, in case you want file size
});

const messageSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true },
    attachments: [attachmentSchema]
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
