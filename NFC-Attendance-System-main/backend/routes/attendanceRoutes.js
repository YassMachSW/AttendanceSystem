const express = require('express');
const router = express.Router();
const {
  getStudentByUID,
  getAttendanceSummary,
} = require('../controllers/attendanceController');

router.get('/', getStudentByUID);              // GET /api/attendances/
router.get('/summary', getAttendanceSummary);  // GET /api/attendances/summary

module.exports = router;