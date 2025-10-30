import Assignment from '../models/Assignment.js';
import path from 'path';
import fs from 'fs';

export const getAssignments = async (req, res) => {
  const assignments = await Assignment.find().sort({ createdAt: -1 });
  res.json({ assignments });
};

export const updateAssignment = async (req, res) => {
  const { id } = req.params;
  const updated = await Assignment.findByIdAndUpdate(id, req.body, { new: true });
  res.json(updated);
};

export const uploadAnswer = async (req, res) => {
  const { id } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  const fileUrl = `/uploads/${file.filename}`;
  const assignment = await Assignment.findByIdAndUpdate(id, {
    status: 'completed',
    answer_url: fileUrl
  }, { new: true });

  res.json({ success: true, fileUrl });
};

export const reportAssignment = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const assignment = await Assignment.findByIdAndUpdate(id, {
    status: 'dispute',
    dispute_reason: reason
  }, { new: true });
  res.json({ success: true, assignment });
};
