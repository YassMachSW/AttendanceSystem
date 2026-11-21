const mongoose = require('mongoose');
const { User } = require('./User');
const { Class } = require('./Class');
const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    status: {
      type: String,
      enum: ['Prisutan', 'Neprisutan', 'CheckedIn', 'Completed'],
      default: 'CheckedIn',
      required: true,
    },
    studentUID: {
      type: String,
      required: false,
    },
    clockIn: {
      type: Date,
      required: true,
      default: Date.now,
    },
    clockOut: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);