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

// AI analysis for all 3 document types
const analyzeDocumentWithAI = async (imageBuffer, mimeType, docType) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey === '') return null;

    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const prompts = {
      photo: `Analyze this photo submitted as proof of event participation. Answer ONLY in this exact JSON format, no extra text:
{
  "isEventPhoto": true or false,
  "hasVisibleDate": true or false,
  "visibleDate": "date string if visible, else null",
  "confidence": "HIGH" or "MEDIUM" or "LOW",
  "reason": "one short sentence",
  "suspicious": true or false
}
Rules:
- isEventPhoto: true if photo shows a person at an event venue, conference, stage, hackathon, sports field, or similar. false if selfie at home, random photo, or screenshot.
- suspicious: true if photo looks fake, edited, or clearly not from any real event.`,

      certificate: `Analyze this image submitted as a participation/achievement certificate. Answer ONLY in this exact JSON format, no extra text:
{
  "isCertificate": true or false,
  "hasParticipantName": true or false,
  "hasEventName": true or false,
  "hasDate": true or false,
  "visibleDate": "date string if visible, else null",
  "confidence": "HIGH" or "MEDIUM" or "LOW",
  "reason": "one short sentence",
  "suspicious": true or false
}
Rules:
- isCertificate: true if document looks like an official certificate, appreciation letter, or award.
- suspicious: true if it looks fake, edited, is a blank template, or is clearly not a real certificate.`,

      brochure: `Analyze this image submitted as an event brochure or poster. Answer ONLY in this exact JSON format, no extra text:
{
  "isBrochure": true or false,
  "hasEventName": true or false,
  "hasDate": true or false,
  "hasVenue": true or false,
  "visibleDate": "date string if visible, else null",
  "confidence": "HIGH" or "MEDIUM" or "LOW",
  "reason": "one short sentence",
  "suspicious": true or false
}
Rules:
- isBrochure: true if image looks like an event brochure, poster, flyer, or invitation.
- suspicious: true if it looks fake, edited, or is clearly not related to any real event.`
    };

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
            { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
            { type: 'text', text: prompts[docType] || prompts.photo },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error(`[OpenAI] API error:`, response.status, JSON.stringify(err));
      console.error(`[OpenAI] Error details - status:`, response.status, '| code:', err?.error?.code, '| message:', err?.error?.message);
      return null;
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error(`[OpenAI] Exception (${docType}):`, err.message);
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

    // EXIF + AI analysis — run in parallel for all document types
    let exifData = null;
    let exifWarning = null;
    let aiAnalysis = null;

    const isImage = req.file.mimetype.startsWith('image/');
    const isPdf   = req.file.mimetype === 'application/pdf';
    console.log(`[Upload] type=${type} | mime=${req.file.mimetype} | isImage=${isImage} | isPdf=${isPdf}`);

    if (isImage || isPdf) {
      if (type === 'photo') {
        [exifData, aiAnalysis] = await Promise.all([
          extractExifDate(req.file.buffer),
          // Photo must be an image for OpenAI vision
          isImage ? analyzeDocumentWithAI(req.file.buffer, req.file.mimetype, 'photo') : null,
        ]);
        if (!exifData || !exifData.date) {
          exifWarning = 'No EXIF date found in photo. Date could not be verified.';
        }
      } else if (type === 'certificate') {
        // PDF: send as image/jpeg placeholder won't work — only analyze images
        aiAnalysis = isImage
          ? await analyzeDocumentWithAI(req.file.buffer, req.file.mimetype, 'certificate')
          : null;
        console.log(`[Upload] certificate aiAnalysis=${JSON.stringify(aiAnalysis)}`);
      } else if (type === 'brochure') {
        aiAnalysis = isImage
          ? await analyzeDocumentWithAI(req.file.buffer, req.file.mimetype, 'brochure')
          : null;
        console.log(`[Upload] brochure aiAnalysis=${JSON.stringify(aiAnalysis)}`);
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
