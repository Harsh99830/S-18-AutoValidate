const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  submitForm, getMyForms,
  getDeanActed, getPendingForDean, deanAction,
  getFormById
} = require('../controllers/s18Controller');
const { generateApprovalPDF } = require('../controllers/pdfController');

// Student
router.post('/',      protect, authorizeRoles('student'), submitForm);
router.get('/my',     protect, authorizeRoles('student'), getMyForms);
router.get('/:id/pdf', protect, authorizeRoles('student'), generateApprovalPDF);

// Dean — final approver
router.get('/dean/acted',   protect, authorizeRoles('dean'), getDeanActed);
router.get('/pending/dean', protect, authorizeRoles('dean'), getPendingForDean);
router.put('/:id/dean',     protect, authorizeRoles('dean'), deanAction);

// Common
router.get('/:id', protect, getFormById);

module.exports = router;
