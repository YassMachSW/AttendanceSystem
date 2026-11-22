const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const generateUniqueUid = async () => {
  let uid = '';
  let exists = true;

  while (exists) {
    uid = crypto.randomBytes(3).toString('hex').toUpperCase();
    const existingUser = await User.findOne({ uid });
    if (!existingUser) {
      exists = false;
    }
  }

  return uid;
};

// @desc    Login user
// @route   POST /api/user/login
const loginUser = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      return res.json({
        _id: user._id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
        assignedClassIds: user.assignedClassIds || [],
        token: generateToken(user._id),
      });
    }

    return res.status(401).json({ message: 'Invalid username or password' });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new employee (saved with role: 'student' and unique random uid)
// @route   POST /api/user/employees
const createEmployee = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const surname = typeof req.body.surname === 'string' ? req.body.surname.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const classId = req.body.classId;

    if (!email || !name || !surname || !password) {
      return res.status(400).json({ message: 'יש למלא אימייל, שם פרטי, שם משפחה וסיסמה.' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'משתמש עם אימייל זה כבר קיים במערכת.' });
    }

    const validClassId =
      classId && mongoose.Types.ObjectId.isValid(classId)
        ? new mongoose.Types.ObjectId(classId)
        : null;

    const uid = await generateUniqueUid();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await User.create({
      uid,
      email,
      name,
      surname,
      password: hashedPassword,
      role: 'student',
      assignedClassIds: validClassId ? [validClassId] : [],
    });

    return res.status(201).json({
      message: 'העובד נוסף בהצלחה',
      employee: {
        _id: newEmployee._id,
        uid: newEmployee.uid,
        email: newEmployee.email,
        name: newEmployee.name,
        surname: newEmployee.surname,
        role: newEmployee.role,
        assignedClassIds: newEmployee.assignedClassIds,
      },
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'כפילות בנתוני משתמש (אימייל או UID כבר קיימים).' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change user password
// @route   PUT /api/user/change-password
const changePassword = async (req, res) => {
  try {
    const userId = req.body.userId || req.body._id;
    const currentPassword =
      typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'יש למלא סיסמה נוכחית וסיסמה חדשה.' });
    }

    if (newPassword.length < 3) {
      return res.status(400).json({ message: 'הסיסמה החדשה קצרה מדי.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא.' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'הסיסמה הנוכחית שגויה.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: 'הסיסמה עודכנה בהצלחה!' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  loginUser,
  createEmployee,
  changePassword,
};