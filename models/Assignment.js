// models/Assignment.js
import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true } // e.g., 'application/pdf', 'image/png'
});

const answerSchema = new mongoose.Schema({
  name: { type: String },
  url: { type: String }
}, { _id: false });

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    topic: { type: String, trim: true },
    description: { type: String, trim: true },
    deadline: { type: Date },
    amount: { type: Number, min: 0 },
    status: { 
      type: String, 
      enum: ['pending', 'in-progress', 'completed', 'dispute'], 
      default: 'pending' 
    },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attachments: [attachmentSchema],
    answer: answerSchema,
    dispute_reason: { type: String, trim: true }
  },
  { timestamps: true }
);

// Indexes for faster querying
assignmentSchema.index({ student: 1, tutor: 1, status: 1, deadline: 1 });

export default mongoose.model('Assignment', assignmentSchema);
