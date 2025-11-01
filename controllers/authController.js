// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true }, // optional
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // optional for now
    role: { type: String, enum: ['student', 'tutor'], default: 'student' },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
