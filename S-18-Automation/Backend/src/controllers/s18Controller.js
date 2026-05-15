const S18 = require('../models/S18');

// POST /api/s18 — Student submits form
const submitForm = async (req, res) => {
  try {
    const course = typeof req.body.course === 'string' ? req.body.course.trim() : '';
    if (!course) return res.status(400).json({ message: 'Course is required.' });
    const form = await S18.create({ ...req.body, course, student: req.user._id });
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

// GET /api/s18/tutor/acted
const getTutorActed = async (req, res) => {
  try {
    const forms = await S18.find({
      'tutorApproval.approvedBy': req.user._id,
      status: { $in: ['tutor_approved', 'hod_approved', 'approved', 'rejected'] }
    }).sort({ 'tutorApproval.approvedAt': -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/s18/hod/acted
const getHODActed = async (req, res) => {
  try {
    const forms = await S18.find({
      'hodApproval.approvedBy': req.user._id,
      status: { $in: ['hod_approved', 'approved', 'rejected'] }
    }).sort({ 'hodApproval.approvedAt': -1 });
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

// GET /api/s18/pending/tutor
const getPendingForTutor = async (req, res) => {
  try {
    const forms = await S18.find({ status: 'pending' })
      .populate('student', 'name email registrationNo')
      .sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/s18/pending/hod
const getPendingForHOD = async (req, res) => {
  try {
    const forms = await S18.find({ status: 'tutor_approved' })
      .populate('student', 'name email registrationNo')
      .populate('tutorApproval.approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/s18/pending/dean — Dean sees hod_approved forms (FINAL step)
const getPendingForDean = async (req, res) => {
  try {
    const forms = await S18.find({ status: 'hod_approved' })
      .populate('student', 'name email registrationNo')
      .populate('tutorApproval.approvedBy', 'name')
      .populate('hodApproval.approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/s18/:id/tutor
const tutorAction = async (req, res) => {
  try {
    const { action, remarks } = req.body;
    const form = await S18.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    form.tutorApproval = { approvedBy: req.user._id, approvedAt: new Date(), remarks, status: action };
    form.status = action === 'approved' ? 'tutor_approved' : 'rejected';
    if (action === 'rejected') form.rejectionReason = remarks;
    await form.save();
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/s18/:id/hod
const hodAction = async (req, res) => {
  try {
    const { action, remarks } = req.body;
    const form = await S18.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    form.hodApproval = { approvedBy: req.user._id, approvedAt: new Date(), remarks, status: action };
    form.status = action === 'approved' ? 'hod_approved' : 'rejected';
    if (action === 'rejected') form.rejectionReason = remarks;
    await form.save();
    res.json(form);
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
      .populate('tutorApproval.approvedBy', 'name')
      .populate('hodApproval.approvedBy', 'name')
      .populate('deanApproval.approvedBy', 'name');
    if (!form) return res.status(404).json({ message: 'Form not found' });
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitForm, getMyForms,
  getTutorActed, getHODActed, getDeanActed,
  getPendingForTutor, getPendingForHOD, getPendingForDean,
  tutorAction, hodAction, deanAction,
  getFormById
};
