const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional — not used for Google OAuth users
  googleId: { type: String }, // Stores Google sub (unique ID)
  profilePic: { type: String, default: '' },
  role: {
    type: String,
    enum: ['student', 'tutor', 'hod', 'dean', 'chief_proctor'],
    default: 'student',
  },
  // Student fields
  registrationNo: { type: String },
  campus: { type: String },
  year: { type: String },
  branch: { type: String },
  mobileNo: { type: String },
  // Staff fields
  department: { type: String },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
