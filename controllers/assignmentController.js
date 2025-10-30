import Assignment from '../models/Assignment.js';

// Student creates new assignment
export const createAssignment = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Not allowed' });
    const assignment = await Assignment.create({ ...req.body, student: req.user._id });
    res.status(201).json(assignment);
  } catch (error) { next(error); }
};

// Both student and tutor can view their related assignments
export const getAssignments = async (req, res, next) => {
  try {
    const filter = req.user.role === 'tutor'
      ? { tutor: req.user._id }
      : { student: req.user._id };
    const assignments = await Assignment.find(filter)
      .populate('student tutor', 'name email role')
      .sort('-createdAt');
    res.json(assignments);
  } catch (error) { next(error); }
};

// Tutor updates status or uploads answer
export const updateAssignment = async (req, res, next) => {
  try {
    if (req.user.role !== 'tutor') return res.status(403).json({ message: 'Only tutors can edit' });
    const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) { next(error); }
};
