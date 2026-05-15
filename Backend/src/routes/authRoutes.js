const express = require('express');
const router = express.Router();
const { googleAuth, googleCallback, getMe, staffLogin, register } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Google OAuth flow (students only — @poornima.edu.in)
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Staff email + password login (HOD, Tutor, Chief Proctor)
router.post('/staff-login', staffLogin);

// Manual Registration
router.post('/register', register);

// Protected: get current user
router.get('/me', protect, getMe);

module.exports = router;
