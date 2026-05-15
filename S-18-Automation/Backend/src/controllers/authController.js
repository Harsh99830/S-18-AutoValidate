const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false, failureRedirect: '/' }, (err, user, info) => {

    if (err) console.error('OAuth Error:', err);
    if (info) console.log('OAuth Info:', info);
    if (!user) console.log('No user returned from Google');

    if (err || !user) {
      const errorMsg = info?.message === 'invalid_domain' ? 'invalid_domain' : 'auth_failed';
      console.log('Redirecting with error:', errorMsg);
      return res.redirect(`${process.env.CLIENT_URL}/login?error=${errorMsg}`);
    }

    console.log('User logged in:', user.email, '| Role:', user.role);

    const token = generateToken(user._id);
    const userData = encodeURIComponent(JSON.stringify({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));

    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&user=${userData}`);
  })(req, res, next);
};

const getMe = async (req, res) => {
  res.json(req.user);
};

// Staff email + password login
const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email aur password dono required hain.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Email ya password galat hai.' });
    }

    // Students should use Google login only
    if (user.role === 'student') {
      return res.status(403).json({ message: 'Students ko Google login use karna chahiye.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ya password galat hai.' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Staff Login Error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, mobile, department, role, password } = req.body;

    // Domain validation
    if (!email.endsWith('@poornima.edu.in')) {
      return res.status(400).json({ message: 'Only @poornima.edu.in accounts are allowed.' });
    }

    // Role check
    if (!['tutor', 'hod', 'chief_proctor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role for registration.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      mobileNo: mobile,
      department,
      role,
      password // Hook will hash it
    });

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

module.exports = { googleAuth, googleCallback, getMe, staffLogin, register };
