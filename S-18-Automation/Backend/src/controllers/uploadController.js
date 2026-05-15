const UploadedFile = require('../models/UploadedFile');
const { uploadToCloudinary } = require('../config/cloudinary');

const FOLDER_MAP = {
  brochure:    'brochures',
  photo:       'photos',
  certificate: 'certificates',
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const type = req.params.type || req.path.replace('/', '');
    const validTypes = ['brochure', 'photo', 'certificate'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `Invalid upload type: ${type}` });
    }
    const folder = FOLDER_MAP[type] || 'others';

    // Upload buffer to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, folder, req.file.mimetype);

    // Save record to MongoDB
    const record = await UploadedFile.create({
      uploadedBy:         req.user._id,
      fileType:           type,
      originalName:       req.file.originalname,
      mimeType:           req.file.mimetype,
      sizeBytes:          req.file.size,
      cloudinaryPublicId: result.public_id,
      cloudinaryUrl:      result.secure_url,
      resourceType:       result.resource_type,
      attachedToForm:     false,
    });

    res.status(201).json({
      url:      record.cloudinaryUrl,
      publicId: record.cloudinaryPublicId,
      fileId:   record._id,
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message || 'File upload failed.' });
  }
};

const attachFilesToForm = async (req, res) => {
  try {
    const { fileIds, s18FormId } = req.body;

    if (!fileIds?.length || !s18FormId) {
      return res.status(400).json({ message: 'fileIds and s18FormId required.' });
    }

    await UploadedFile.updateMany(
      { _id: { $in: fileIds }, uploadedBy: req.user._id },
      { $set: { attachedToForm: true, s18FormId } }
    );

    res.json({ message: 'Files linked to form.' });
  } catch (err) {
    console.error('Attach error:', err);
    res.status(500).json({ message: 'Could not attach files.' });
  }
};

module.exports = { uploadFile, attachFilesToForm };
