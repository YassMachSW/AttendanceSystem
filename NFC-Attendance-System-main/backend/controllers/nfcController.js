const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');

// @desc    Clock-in / Clock-out attendance via NFC tap
// @route   POST /api/nfc
const saveAttendance = async (req, res) => {
  const { uid, classId: providedClassId, locationId } = req.body;

  if (!uid) {
    return res.status(400).send({ message: 'UID is missing' });
  }

  try {
    const employee = await User.findOne({ uid });

    if (!employee) {
      return res.status(404).send({ message: 'User not found' });
    }

    let classId = providedClassId || locationId;
    let placeDoc = null;

    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      placeDoc = await Class.findById(classId);
    }

    if (!placeDoc) {
      const randomPlace = await Class.aggregate([{ $sample: { size: 1 } }]);
      placeDoc = randomPlace[0] || null;
      classId = placeDoc?._id;
    }

    if (!classId) {
      return res.status(400).send({ message: 'Location / Class ID is missing' });
    }

    const placeName = placeDoc?.name || placeDoc?.title || '';

    // Check if there is an open session (clocked in, not clocked out yet)
    const openAttendance = await Attendance.findOne({
      studentId: employee._id,
      clockOut: null,
    }).sort({ clockIn: -1 });

    const now = new Date();

    // Case 1: Open session exists -> Clock-Out
    if (openAttendance) {
      const diffMs = now - new Date(openAttendance.clockIn);
      const durationMinutes = Math.max(0, Math.round(diffMs / 60000));

      openAttendance.clockOut = now;
      openAttendance.durationMinutes = durationMinutes;
      openAttendance.status = 'Completed';
      await openAttendance.save();

      return res.status(200).send({
        action: 'clock-out',
        message: 'Clock-out recorded successfully',
        className: placeName,
        locationName: placeName,
        clockIn: openAttendance.clockIn,
        clockOut: openAttendance.clockOut,
        durationMinutes,
        attendance: openAttendance,
      });
    }

    // Case 2: No open session -> Clock-In
    const attendance = new Attendance({
      studentId: employee._id,
      classId,
      status: 'CheckedIn',
      studentUID: uid,
      clockIn: now,
      clockOut: null,
    });

    await attendance.save();

    return res.status(201).send({
      action: 'clock-in',
      message: 'Clock-in recorded successfully',
      className: placeName,
      locationName: placeName,
      clockIn: attendance.clockIn,
      attendance,
    });
  } catch (error) {
    console.error('Error processing NFC tap:', error);
    return res.status(500).send({ message: 'Internal server error' });
  }
};

module.exports = {
  saveAttendance,
};