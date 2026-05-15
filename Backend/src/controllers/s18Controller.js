const S18 = require('../models/S18');

// POST /api/s18 — Student submits form
const submitForm = async (req, res) => {
  try {
    const {
      studentName, registrationNo, course, campus, year, branch,
      email, mobileNo, cumulativeAttendance, activityName,
      organizingInstitution, activityType, activityTypeOther,
      fromDate, toDate, teamMembers, parentMobileNo,
      brochureLink, participantPhotoLink, certificateLink
    } = req.body;

    // Registration No. format: 4 digits + 2-6 uppercase letters + 3 digits
    const regNoRegex = /^[0-9]{4}[A-Z]{2,6}[0-9]{3}$/;
    if (!regNoRegex.test((registrationNo || '').trim())) {
      return res.status(400).json({ message: 'Registration number is not valid. Expected format: 2021BTCS001' });
    }

    // Mobile No. — exactly 10 digits
    if (!/^[0-9]{10}$/.test(mobileNo)) {
      return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
    }

    // Email — must be @poornima.edu.in
    if (!email || !email.endsWith('@poornima.edu.in')) {
      return res.status(400).json({ message: 'Only @poornima.edu.in email addresses are allowed.' });
    }

    // Cumulative Attendance — 0 to 100
    const attendance = Number(cumulativeAttendance);
    if (isNaN(attendance) || attendance < 0 || attendance > 100) {
      return res.status(400).json({ message: 'Cumulative attendance must be between 0 and 100.' });
    }

    // Course
    const trimmedCourse = typeof course === 'string' ? course.trim() : '';
    if (!trimmedCourse) {
      return res.status(400).json({ message: 'Course is required.' });
    }

    // Activity Dates
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Please provide both From Date and To Date.' });
    }
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (from > today) {
      return res.status(400).json({ message: 'From Date cannot be a future date.' });
    }
    if (to < from) {
      return res.status(400).json({ message: 'To Date cannot be before From Date.' });
    }
    const diffDays = (to - from) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      return res.status(400).json({ message: 'Activity duration cannot exceed 30 days.' });
    }

    // Activity Type Other
    if (activityType === 'Other' && !activityTypeOther?.trim()) {
      return res.status(400).json({ message: 'Please specify the activity type.' });
    }

    // Team Members
    if (Array.isArray(teamMembers) && teamMembers.length > 0) {
      for (let i = 0; i < teamMembers.length; i++) {
        const member = teamMembers[i];
        if (!member.name || !member.name.trim()) {
          return res.status(400).json({ message: `Member ${i + 1} name is required.` });
        }
        if (!regNoRegex.test((member.registrationNo || '').trim())) {
          return res.status(400).json({ message: `Member ${i + 1} registration number is not valid.` });
        }
        if (member.registrationNo.trim() === registrationNo.trim()) {
          return res.status(400).json({ message: `Member ${i + 1} cannot have the same registration number as you.` });
        }
      }
    }

    // Parent Mobile — exactly 10 digits
    if (!/^[0-9]{10}$/.test(parentMobileNo)) {
      return res.status(400).json({ message: 'Parent mobile number must be exactly 10 digits.' });
    }

    // Documents — all 3 required
    if (!brochureLink || !participantPhotoLink || !certificateLink) {
      return res.status(400).json({ message: 'All 3 documents (brochure, photo, certificate) are required.' });
    }

    const form = await S18.create({ ...req.body, course: trimmedCourse, student: req.user._id });
    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/s18/my — Student sees own forms
const getMyForms = async (req, res) => {
  try {
    const forms = await S18.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/s18/dean/acted
const getDeanActed = async (req, res) => {
  try {
    const forms = await S18.find({
      'deanApproval.approvedBy': req.user._id,
      status: { $in: ['approved', 'rejected'] }
    }).sort({ 'deanApproval.approvedAt': -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/s18/pending/dean — Dean sees pending forms (FINAL step)
const getPendingForDean = async (req, res) => {
  try {
    const forms = await S18.find({ status: 'pending' })
      .populate('student', 'name email registrationNo')
      .sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/s18/:id/dean — FINAL approval, sets status to 'approved'
const deanAction = async (req, res) => {
  try {
    const { action, remarks, bonusAttendanceGranted } = req.body;
    const form = await S18.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    form.deanApproval = {
      approvedBy: req.user._id,
      approvedAt: new Date(),
      remarks,
      status: action,
      bonusAttendanceGranted: action === 'approved' ? (bonusAttendanceGranted || 0) : 0
    };
    // Dean is final — approved means fully approved
    form.status = action === 'approved' ? 'approved' : 'rejected';
    if (action === 'rejected') form.rejectionReason = remarks;
    await form.save();
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/s18/:id — Single form detail
const getFormById = async (req, res) => {
  try {
    const form = await S18.findById(req.params.id)
      .populate('student', 'name email registrationNo')
      .populate('deanApproval.approvedBy', 'name');
    if (!form) return res.status(404).json({ message: 'Form not found' });
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitForm, getMyForms,
  getDeanActed, getPendingForDean, deanAction,
  getFormById
};
