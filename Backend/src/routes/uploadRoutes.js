const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadFile, attachFilesToForm } = require('../controllers/uploadController');
const { memoryStorage } = require('../config/cloudinary');

const upload = memoryStorage.single('file');

const handleUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

// POST /api/upload/brochure
// POST /api/upload/photo
// POST /api/upload/certificate
router.post('/:type', protect, authorizeRoles('student'), handleUpload, uploadFile);

// PATCH /api/upload/attach
router.patch('/attach', protect, authorizeRoles('student'), attachFilesToForm);

module.exports = router;
