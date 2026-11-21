const express = require('express');
const router = express.Router();
const { loginUser, createEmployee } = require('../controllers/loginController');

// Public routes
router.post('/login', loginUser);          // POST /api/user/login
router.post('/employees', createEmployee); // POST /api/user/employees

module.exports = router;