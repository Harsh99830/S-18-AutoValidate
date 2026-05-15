require('dotenv').config();

const { cloudinary, uploadToCloudinary } = require('../src/config/cloudinary');

const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
);

(async () => {
  await cloudinary.api.ping();
  const result = await uploadToCloudinary(tinyPng, 'diagnostics', 'image/png');
  console.log('Cloudinary credentials are valid.');
  console.log(`Test upload: ${result.secure_url}`);
})().catch((error) => {
  console.error(error.message || error.error?.message || 'Cloudinary check failed.');
  process.exit(1);
});
