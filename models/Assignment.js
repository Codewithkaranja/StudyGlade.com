import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: String,
  subject: String,
  topic: String,
  description: String,
  deadline: Date,
  amount: Number,
  status: { type: String, default: 'pending' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [{ name: String, url: String, type: String }],
  answer: { name: String, url: String },
}, { timestamps: true });

export default mongoose.model('Assignment', assignmentSchema);
