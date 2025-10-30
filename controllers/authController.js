import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// Register a new user
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    // Create new user
    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      user,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      user,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};
