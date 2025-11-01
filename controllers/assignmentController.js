import Assignment from '../models/Assignment.js';

// Student creates new assignment
export const createAssignment = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'student') 
      return res.status(403).json({ message: 'Not allowed' });

    const assignment = await Assignment.create({ ...req.body, student: req.user._id });
    res.status(201).json(assignment);
  } catch (error) { 
    next(error); 
  }
};

// Both student and tutor can view their related assignments
export const getAssignments = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    const filter = req.user.role === 'tutor'
      ? { tutor: req.user._id }
      : { student: req.user._id };

    const assignments = await Assignment.find(filter)
      .populate('student tutor', 'name email role _id')
      .sort('-createdAt');

    res.json(assignments);
  } catch (error) { 
    next(error); 
  }
};

// Tutor updates status or uploads answer
export const updateAssignment = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'tutor') 
      return res.status(403).json({ message: 'Only tutors can edit' });

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (assignment.tutor && assignment.tutor.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized to update this assignment' });

    const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) { 
    next(error); 
  }
};

// ✅ Attach a file to an assignment
export const attachFileToAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileData = {
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      type: req.file.mimetype,
    };

    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      { $push: { attachments: fileData } },
      { new: true }
    );

    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    res.status(200).json({
      message: "File attached to assignment successfully",
      assignment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error attaching file" });
  }
};
