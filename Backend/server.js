require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const passport = require('passport');

// IMPORTANT: passport strategy must be configured BEFORE routes are loaded
require('./src/config/passport');

const authRoutes = require('./src/routes/authRoutes');
const s18Routes = require('./src/routes/s18Routes');
const uploadRoutes = require('./src/routes/uploadRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));
app.use(passport.initialize());

app.get('/', (req, res) => res.json({ message: 'S18 Automation API running' }));
app.use('/api/auth', authRoutes);
app.use('/api/s18', s18Routes);
app.use('/api/upload', uploadRoutes);

// Connect to MongoDB once (cached for serverless)
connectDB().catch(err => console.error('MongoDB connection error:', err));

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
