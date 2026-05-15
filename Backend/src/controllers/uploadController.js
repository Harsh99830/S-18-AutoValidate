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

// OpenAI Vision AI analysis for participant photo
const analyzePhotoWithAI = async (imageBuffer, mimeType) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') return null;

    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'low' },
            },
            {
              type: 'text',
              text: `Analyze this photo submitted as proof of event participation. Answer ONLY in this exact JSON format, no extra text:
{
  "isEventPhoto": true or false,
  "hasVisibleDate": true or false,
  "visibleDate": "date string if visible, else null",
  "confidence": "HIGH" or "MEDIUM" or "LOW",
  "reason": "one short sentence explaining your finding",
  "suspicious": true or false
}

Rules:
- isEventPhoto: true if photo shows a person at an event venue, conference, stage, hackathon, sports field, or similar activity setting. false if it is a selfie at home, random photo, screenshot, or clearly not an event.
- hasVisibleDate: true if a date watermark, timestamp, or date text is clearly visible in the image.
- visibleDate: extract the date if visible, else null.
- suspicious: true if the photo looks fake, edited, or clearly not from any real event.
- reason: be specific and brief.`,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[OpenAI] API error:', response.status, JSON.stringify(err));
      return null;
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('[OpenAI] Exception:', err.message);
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
    let aiAnalysis = null;
    if (type === 'photo' && req.file.mimetype.startsWith('image/')) {
      // Run EXIF + AI analysis in parallel
      [exifData, aiAnalysis] = await Promise.all([
        extractExifDate(req.file.buffer),
        analyzePhotoWithAI(req.file.buffer, req.file.mimetype),
      ]);
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
      aiAnalysis:         aiAnalysis || null,
    });

    res.status(201).json({
      url:         record.cloudinaryUrl,
      publicId:    record.cloudinaryPublicId,
      fileId:      record._id,
      exifDate:    exifData?.date || null,
      exifGps:     exifData?.gps || null,
      exifWarning: exifWarning || null,
      aiAnalysis:  aiAnalysis || null,
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
