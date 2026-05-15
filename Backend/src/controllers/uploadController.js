const UploadedFile = require('../models/UploadedFile');
const { uploadToCloudinary } = require('../config/cloudinary');
let exifr;
try { exifr = require('exifr'); } catch { exifr = null; }

const FOLDER_MAP = {
  brochure:    'brochures',
  photo:       'photos',
  certificate: 'certificates',
};

// Extract EXIF date from photo buffer
const extractExifDate = async (buffer) => {
  try {
    if (!exifr) return null;
    const data = await exifr.parse(buffer, { pick: ['DateTimeOriginal', 'DateTime', 'CreateDate', 'GPSLatitude', 'GPSLongitude'] });
    if (!data) return null;
    const date = data.DateTimeOriginal || data.DateTime || data.CreateDate || null;
    const gps = (data.GPSLatitude && data.GPSLongitude)
      ? { lat: data.GPSLatitude, lng: data.GPSLongitude }
      : null;
    return { date, gps };
  } catch {
    return null;
  }
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

    // EXIF extraction — only for participant photos
    let exifData = null;
    let exifWarning = null;
    if (type === 'photo' && req.file.mimetype.startsWith('image/')) {
      exifData = await extractExifDate(req.file.buffer);
      if (!exifData || !exifData.date) {
        exifWarning = 'No EXIF date found in photo. Date could not be verified.';
      }
    }

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
      exifDate:           exifData?.date || null,
      exifGps:            exifData?.gps || null,
      exifVerified:       type === 'photo' ? (!!exifData?.date) : null,
    });

    res.status(201).json({
      url:         record.cloudinaryUrl,
      publicId:    record.cloudinaryPublicId,
      fileId:      record._id,
      exifDate:    exifData?.date || null,
      exifGps:     exifData?.gps || null,
      exifWarning: exifWarning || null,
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
