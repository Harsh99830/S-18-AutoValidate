const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  submitForm, getMyForms,
  getTutorActed, getHODActed, getDeanActed,
  getPendingForTutor, getPendingForHOD, getPendingForDean,
  tutorAction, hodAction, deanAction,
  getFormById
} = require('../controllers/s18Controller');
const { generateApprovalPDF } = require('../controllers/pdfController');

// Student
router.post('/',      protect, authorizeRoles('student'), submitForm);
router.get('/my',     protect, authorizeRoles('student'), getMyForms);
router.get('/:id/pdf', protect, authorizeRoles('student'), generateApprovalPDF);

// Tutor
router.get('/tutor/acted',   protect, authorizeRoles('tutor'), getTutorActed);
router.get('/pending/tutor', protect, authorizeRoles('tutor'), getPendingForTutor);
router.put('/:id/tutor',     protect, authorizeRoles('tutor'), tutorAction);

// HOD
router.get('/hod/acted',   protect, authorizeRoles('hod'), getHODActed);
router.get('/pending/hod', protect, authorizeRoles('hod'), getPendingForHOD);
router.put('/:id/hod',     protect, authorizeRoles('hod'), hodAction);

// Dean — final approver
router.get('/dean/acted',   protect, authorizeRoles('dean'), getDeanActed);
router.get('/pending/dean', protect, authorizeRoles('dean'), getPendingForDean);
router.put('/:id/dean',     protect, authorizeRoles('dean'), deanAction);

// Common
router.get('/:id', protect, getFormById);

module.exports = router;
