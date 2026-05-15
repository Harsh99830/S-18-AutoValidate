const mongoose = require('mongoose');

const s18Schema = new mongoose.Schema({
  // Student Info
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  registrationNo: { type: String, required: true },
  campus: { type: String, required: true, trim: true },
  course: { type: String, required: true, trim: true },
  year: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },
  email: { type: String, required: true },
  mobileNo: { type: String, required: true },

  // Activity Details
  activityName: { type: String, required: true },
  organizingInstitution: { type: String, required: true },
  activityType: {
    type: String,
    enum: ['Hackathon', 'Technical Competition', 'Workshop/Seminar', 'Cultural Event', 'Sports', 'Other'],
    required: true
  },
  activityTypeOther: { type: String, trim: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  cumulativeAttendance: { type: Number, required: true },
  lastParticipation: { type: String },

  // Team Members
  teamMembers: [{
    name: String,
    registrationNo: String
  }],

  // Documents
  participantPhotoLink: { type: String, required: true },
  certificateLink:      { type: String, required: true },
  brochureLink:         { type: String, required: true },

  // Parent Consent
  parentConsentReceived: { type: Boolean, default: false },
  parentMobileNo: { type: String },

  // Approval Chain: pending → tutor_approved → hod_approved → approved / rejected
  status: {
    type: String,
    enum: ['pending', 'tutor_approved', 'hod_approved', 'approved', 'rejected'],
    default: 'pending'
  },

  tutorApproval: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    remarks: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  },

  hodApproval: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    remarks: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  },

  // Dean is the FINAL approver — includes bonus attendance
  deanApproval: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    remarks: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    bonusAttendanceGranted: { type: Number, default: 0 }
  },

  // Post Participation
  postParticipation: {
    hardCopySubmitted: { type: Boolean, default: false },
    softCopyEmailed:   { type: Boolean, default: false },
    finalBonusGranted: { type: Boolean, default: false },
    finalBonusDays:    { type: Number, default: 0 }
  },

  rejectionReason: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('S18', s18Schema);
