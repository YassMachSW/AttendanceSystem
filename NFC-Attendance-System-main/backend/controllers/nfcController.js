const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');

// @desc    Clock-in / Clock-out attendance via NFC tap
// @route   POST /api/nfc
const saveAttendance = async (req, res) => {
  const { uid, classId: providedClassId } = req.body;

  if (!uid) {
    return res.status(400).send({ message: 'UID is missing' });
  }

  try {
    const student = await User.findOne({ uid });

    if (!student) {
      return res.status(404).send({ message: 'Student not found' });
    }

    let classId = providedClassId;
    if (!classId) {
      const classIdArray = await Class.aggregate([{ $sample: { size: 1 } }]);
      classId = classIdArray[0]?._id;
    }

    if (!classId) {
      return res.status(400).send({ message: 'Class ID is missing' });
    }

    // Check if there is an open session (clocked in, not clocked out yet)
    const openAttendance = await Attendance.findOne({
      studentId: student._id,
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
        clockIn: openAttendance.clockIn,
        clockOut: openAttendance.clockOut,
        durationMinutes,
        attendance: openAttendance,
      });
    }

    // Case 2: No open session -> Clock-In
    const attendance = new Attendance({
      studentId: student._id,
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