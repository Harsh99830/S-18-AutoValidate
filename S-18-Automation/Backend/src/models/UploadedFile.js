const mongoose = require('mongoose');

/**
 * UploadedFile collection
 * Tracks every document uploaded to Cloudinary.
 * Each S18 form references 3 of these (_id or URL).
 *
 * Why a separate collection?
 * - Lets you audit all files independently of forms
 * - Lets you delete orphaned files (uploaded but form never submitted)
 * - Makes it easy to re-use files if student re-submits
 * - Keeps the S18 model clean (just stores the URL string)
 */
const uploadedFileSchema = new mongoose.Schema({
  // Who uploaded it
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // What kind of document
  fileType: {
    type: String,
    enum: ['brochure', 'certificate', 'photo', 'other'],
    required: true,
  },

  // Original file info
  originalName: { type: String, required: true },
  mimeType:     { type: String, required: true },
  sizeBytes:    { type: Number },

  // Cloudinary info
  cloudinaryPublicId: { type: String, required: true },
  cloudinaryUrl:      { type: String, required: true }, // secure_url
  resourceType:       { type: String, default: 'image' }, // 'image' or 'raw' (for PDFs)

  // Link back to the form it belongs to (set after form submission)
  s18FormId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'S18',
    default: null,
  },

  // Orphan cleanup — if form never submitted, this stays false
  attachedToForm: { type: Boolean, default: false },

}, { timestamps: true });

// Index for quick lookup by uploader and form
uploadedFileSchema.index({ uploadedBy: 1, createdAt: -1 });
uploadedFileSchema.index({ s18FormId: 1 });
uploadedFileSchema.index({ attachedToForm: 1 }); // for orphan cleanup job later

module.exports = mongoose.model('UploadedFile', uploadedFileSchema);
