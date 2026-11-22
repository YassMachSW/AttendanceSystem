const express = require('express');
const router = express.Router();
const {
  getStudentByUID,
  getAttendanceSummary,
  getBranchEmployees,
} = require('../controllers/attendanceController');

router.get('/', getStudentByUID);                 // GET /api/attendances/
router.get('/summary', getAttendanceSummary);     // GET /api/attendances/summary
router.get('/employees', getBranchEmployees);     // GET /api/attendances/employees

module.exports = router;