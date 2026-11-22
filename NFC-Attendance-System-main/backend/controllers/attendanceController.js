const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const User = require('../models/User');

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

const resolveAllowedClassIds = async ({ managerId, classId }) => {
  let allowedIds = null;

  if (managerId && mongoose.Types.ObjectId.isValid(managerId)) {
    const managedClasses = await Class.find({ professorId: managerId }).select('_id');
    allowedIds = managedClasses.map((c) => String(c._id));
  }

  if (classId && mongoose.Types.ObjectId.isValid(classId)) {
    const targetId = String(classId);
    if (allowedIds !== null) {
      return allowedIds.includes(targetId) ? [targetId] : [];
    }
    return [targetId];
  }

  return allowedIds;
};

// @desc    Gets attendance records (filtered by studentUID, managerId/professorId, classId, optional ?month=YYYY-MM)
// @route   GET /api/attendances/
const getStudentByUID = async (req, res) => {
  try {
    const { studentUID, month, classId } = req.query;
    const managerId = req.query.managerId || req.query.professorId;

    const allowedClassIds = await resolveAllowedClassIds({ managerId, classId });
    if (allowedClassIds !== null && allowedClassIds.length === 0) {
      return res.json([]);
    }

    const filter = {};
    if (studentUID) {
      filter.studentUID = studentUID;
    }
    if (allowedClassIds !== null) {
      filter.classId = { $in: allowedClassIds };
    }

    const attendances = await Attendance.find(filter)
      .populate('studentId', 'name surname email uid role')
      .populate('classId', 'name roomNumber professorId')
      .sort({ clockIn: -1, createdAt: -1 });

    const filtered = month ? attendances.filter((rec) => matchesMonth(rec, month)) : attendances;

    return res.json(filtered);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching attendance data', error: err.message });
  }
};

// @desc    Gets total minutes/hours summary per student per branch (filtered by managerId/professorId, classId, ?month=YYYY-MM)
// @route   GET /api/attendances/summary
const getAttendanceSummary = async (req, res) => {
  try {
    const { month, classId } = req.query;
    const managerId = req.query.managerId || req.query.professorId;

    const allowedClassIds = await resolveAllowedClassIds({ managerId, classId });
    if (allowedClassIds !== null && allowedClassIds.length === 0) {
      return res.json([]);
    }

    const filter = allowedClassIds !== null ? { classId: { $in: allowedClassIds } } : {};

    const records = await Attendance.find(filter)
      .populate('studentId', 'name surname email uid')
      .populate('classId', 'name roomNumber professorId');

    const summaryMap = new Map();

    for (const rec of records) {
      if (!matchesMonth(rec, month)) continue;

      const mins = calculateMinutes(rec);
      if (mins <= 0 && !rec.clockOut) continue;

      const studentKey = String(rec.studentId?._id || rec.studentUID || 'unknown');
      const classKey = String(rec.classId?._id || 'unknown');
      const compositeKey = `${studentKey}_${classKey}`;

      if (!summaryMap.has(compositeKey)) {
        summaryMap.set(compositeKey, {
          student: rec.studentId || null,
          studentUID: rec.studentUID,
          classId: rec.classId || null,
          totalMinutes: 0,
          sessionsCount: 0,
        });
      }
      const entry = summaryMap.get(compositeKey);
      entry.totalMinutes += mins;
      entry.sessionsCount += 1;
    }

    const summary = Array.from(summaryMap.values()).map((item) => ({
      ...item,
      totalHours: Number((item.totalMinutes / 60).toFixed(2)),
    }));

    return res.json(summary);
  } catch (err) {
    return res.status(500).json({ message: 'Error calculating attendance summary', error: err.message });
  }
};

// @desc    Gets employees belonging strictly to branches managed by managerId/professorId (or a specific classId)
// @route   GET /api/attendances/employees
const getBranchEmployees = async (req, res) => {
  try {
    const { classId } = req.query;
    const managerId = req.query.managerId || req.query.professorId;

    const allowedClassIds = await resolveAllowedClassIds({ managerId, classId });
    if (allowedClassIds !== null && allowedClassIds.length === 0) {
      return res.json([]);
    }

    const attendanceStudentIds =
      allowedClassIds !== null
        ? await Attendance.distinct('studentId', { classId: { $in: allowedClassIds } })
        : await Attendance.distinct('studentId');

    const userFilter = {
      role: 'student',
      ...(allowedClassIds !== null
        ? {
            $or: [
              { assignedClassIds: { $in: allowedClassIds } },
              { _id: { $in: attendanceStudentIds } },
            ],
          }
        : {}),
    };

    const employees = await User.find(userFilter)
      .select('-password')
      .populate('assignedClassIds', 'name roomNumber professorId');

    // מסננים שדות assignedClassIds כך שיכללו רק סניפים שהמנהל מורשה לראות
    const scopedEmployees = employees.map((emp) => {
      const obj = emp.toObject();
      if (allowedClassIds !== null) {
        obj.assignedClassIds = (obj.assignedClassIds || []).filter((cls) =>
          allowedClassIds.includes(String(cls._id || cls))
        );
      }
      return obj;
    });

    return res.json(scopedEmployees);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching branch employees', error: err.message });
  }
};

module.exports = {
  getStudentByUID,
  getAttendanceSummary,
  getBranchEmployees,
};