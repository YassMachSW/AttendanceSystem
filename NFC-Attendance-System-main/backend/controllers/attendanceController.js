const Attendance = require('../models/Attendance');

const calculateMinutes = (rec) => {
  if (typeof rec.durationMinutes === 'number' && !Number.isNaN(rec.durationMinutes)) {
    return Math.max(0, rec.durationMinutes);
  }
  if (rec.clockIn && rec.clockOut) {
    const diffMs = new Date(rec.clockOut) - new Date(rec.clockIn);
    if (diffMs > 0) {
      return Math.round(diffMs / 60000);
    }
  }
  return 0;
};

const matchesMonth = (rec, monthStr) => {
  if (!monthStr) return true; // פורמט צפוי: YYYY-MM
  const refDate = rec.clockIn || rec.date || rec.createdAt;
  if (!refDate) return false;
  const d = new Date(refDate);
  if (Number.isNaN(d.getTime())) return false;
  const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return ym === monthStr;
};

// @desc    Gets attendance records by studentUID (optional ?month=YYYY-MM)
// @route   GET /api/attendances/
const getStudentByUID = async (req, res) => {
  try {
    const { studentUID, month } = req.query;
    const filter = studentUID ? { studentUID } : {};

    const attendances = await Attendance.find(filter)
      .populate('studentId')
      .populate('classId')
      .sort({ clockIn: -1, createdAt: -1 });

    const filtered = month ? attendances.filter((rec) => matchesMonth(rec, month)) : attendances;

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attendance data', error: err.message });
  }
};

// @desc    Gets total minutes/hours summary per student (optional ?month=YYYY-MM)
// @route   GET /api/attendances/summary
const getAttendanceSummary = async (req, res) => {
  try {
    const { month } = req.query;
    const records = await Attendance.find({})
      .populate('studentId', 'name surname email uid')
      .populate('classId', 'name title');

    const summaryMap = new Map();

    for (const rec of records) {
      if (!matchesMonth(rec, month)) continue;

      const mins = calculateMinutes(rec);
      if (mins <= 0 && !rec.clockOut) continue;

      const key = String(rec.studentId?._id || rec.studentUID || 'unknown');
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          student: rec.studentId || null,
          studentUID: rec.studentUID,
          totalMinutes: 0,
          sessionsCount: 0,
        });
      }
      const entry = summaryMap.get(key);
      entry.totalMinutes += mins;
      entry.sessionsCount += 1;
    }

    const summary = Array.from(summaryMap.values()).map((item) => ({
      ...item,
      totalHours: Number((item.totalMinutes / 60).toFixed(2)),
    }));

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Error calculating attendance summary', error: err.message });
  }
};

module.exports = {
  getStudentByUID,
  getAttendanceSummary,
};