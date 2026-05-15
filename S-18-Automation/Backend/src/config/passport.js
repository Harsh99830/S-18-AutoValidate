const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const crypto = require('crypto');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const rawEmail = profile.emails[0].value;
    const email = rawEmail.toLowerCase().trim(); // normalize
    console.log('Google OAuth - Email received:', email);

    // STRICT: Only @poornima.edu.in domain is allowed via Google OAuth
    if (!email.endsWith('@poornima.edu.in')) {
      console.log('BLOCKED - non-poornima email attempted login:', email);
      return done(null, false, { message: 'invalid_domain' });
    }

    // Find existing user by email
    let user = await User.findOne({ email });
    console.log('User found in DB:', user ? 'Yes' : 'No');

    if (user) {
      // Keep googleId and profilePic in sync
      if (!user.googleId || !user.profilePic) {
        user.googleId = profile.id;
        user.profilePic = profile.photos?.[0]?.value || '';
        await user.save();
      }
      return done(null, user);
    }

    // New student — domain already verified above
    user = await User.create({
      name: profile.displayName,
      email,
      googleId: profile.id,
      password: crypto.randomBytes(20).toString('hex'),
      role: 'student',
      profilePic: profile.photos?.[0]?.value || '',
    });

    console.log('New student created:', user.email);
    return done(null, user);

  } catch (error) {
    console.error('Passport error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
