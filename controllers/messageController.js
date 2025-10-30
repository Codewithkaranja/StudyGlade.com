import Message from '../models/Message.js';

export const getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ assignment: req.params.assignmentId });
    res.json(messages);
  } catch (error) { next(error); }
};

export const sendMessage = async (req, res, next) => {
  try {
    const message = await Message.create({
      assignment: req.params.assignmentId,
      sender: req.user.role,
      text: req.body.text,
    });
    res.status(201).json(message);
  } catch (error) { next(error); }
};
