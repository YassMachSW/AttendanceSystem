const express = require('express');
const router = express.Router();
const {
  loginUser,
  createEmployee,
  changePassword,
} = require('../controllers/loginController');

// Public routes
router.post('/login', loginUser);
router.post('/employees', createEmployee);
router.put('/change-password', changePassword);

module.exports = router;