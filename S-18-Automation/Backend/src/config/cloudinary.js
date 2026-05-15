require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
}

// Store file in memory buffer first, then we stream to Cloudinary manually
// This avoids multer-storage-cloudinary version compatibility issues entirely
const memoryStorage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, and PDF files are allowed.'), false);
    }
  },
});

// Helper: upload buffer to Cloudinary via stream
const uploadToCloudinary = (buffer, folder, mimetype) => {
  return new Promise((resolve, reject) => {
    const isPdf = mimetype === 'application/pdf';
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `s18/${folder}`,
        resource_type: isPdf ? 'raw' : 'image',
        public_id: `${Date.now()}`,
      },
      (error, result) => {
        if (error) {
          const message = error.message || error.error?.message || 'Cloudinary upload failed.';
          return reject(new Error(message));
        }
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

module.exports = { memoryStorage, uploadToCloudinary, cloudinary };
