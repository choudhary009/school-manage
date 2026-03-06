const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const compression = require('compression');

dotenv.config();

const app = express();

// GZIP compression for faster API responses
app.use(compression());

/* =========================
   CORS CONFIG (PRODUCTION SAFE)
========================= */

const allowedOrigins = [
  'https://manditradeerp.com',
  'https://www.manditradeerp.com',
  'https://atsjourney.com',
  'https://www.atsjourney.com',
  'https://easycomission.com',
  'https://www.easycomission.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Fixes Vercel caching + dynamic CORS
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

/* =========================
   BODY PARSERS
========================= */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* =========================
   DESKTOP OFFLINE QUEUE (Electron only)
========================= */
app.use(require('./middleware/desktopQueue'));

/* =========================
   MONGODB CONNECTION (OPTIMIZED FOR VERCEL)
========================= */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://usama:1234usama@cluster0.lpskxdo.mongodb.net/manditrade?appName=Cluster0';

// Clear cached connection
global.mongoose = { conn: null, promise: null };
let cached = global.mongoose;

// Function to connect to MongoDB with retry logic
async function connectMongoDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log(
      'Connecting to MongoDB:',
      MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
    );

    const opts = {
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for Vercel
      socketTimeoutMS: 60000, // Increased to 60 seconds
      connectTimeoutMS: 30000, // Increased to 30 seconds
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 1,
    };

    // Disable mongoose buffering globally (not in connection options)
    mongoose.set('bufferCommands', false);

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB Connected Successfully to: manditrade');
        mongoose.connection.on('error', (err) => {
          console.error('MongoDB connection error:', err);
        });
        mongoose.connection.on('disconnected', () => {
          console.warn('MongoDB disconnected. Reconnecting...');
        });
        return mongoose;
      })
      .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.error('\n🔧 Troubleshooting Steps:');
        console.error('1. Check your internet connection');
        console.error('2. Verify MongoDB Atlas cluster is running (not paused)');
        console.error('3. Check if your IP is whitelisted in MongoDB Atlas Network Access (allow 0.0.0.0/0 for Vercel)');
        console.error('4. Verify MongoDB connection string is correct in Vercel environment variables');
        console.error('5. Check Vercel deployment logs for more details');
        // Clear the promise so we can retry
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Initialize connection
connectMongoDB().catch((err) => {
  console.error('Failed to connect to MongoDB on startup:', err.message);
  // Don't exit - let server start, connection will be retried on first request
});

global.mongoose = cached;

/* =========================
   MIDDLEWARE: Ensure MongoDB Connection
========================= */

// Middleware to ensure MongoDB is connected before handling requests
async function ensureMongoConnection(req, res, next) {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return next();
    }

    // Try to connect if not connected
    if (mongoose.connection.readyState === 0) {
      await connectMongoDB();
    }

    // Wait a bit if still connecting
    if (mongoose.connection.readyState === 2) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', resolve);
        setTimeout(resolve, 5000); // Max 5 second wait
      });
    }

    // If still not connected, return error
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database connection unavailable. Please try again in a moment.',
        error: 'MongoDB connection not ready'
      });
    }

    next();
  } catch (error) {
    console.error('MongoDB connection check error:', error.message);
    return res.status(503).json({
      message: 'Database connection error. Please try again.',
      error: error.message
    });
  }
}

/* =========================
   ROUTES
========================= */

// Apply MongoDB connection check middleware to all routes
app.use('/api/auth', ensureMongoConnection, require('./routes/auth'));
app.use('/api/admin', ensureMongoConnection, require('./routes/admin'));
app.use('/api/company', ensureMongoConnection, require('./routes/company'));
app.use('/api/bill', ensureMongoConnection, require('./routes/bill'));
app.use('/api/sale', ensureMongoConnection, require('./routes/sale'));
app.use('/api/recovery', ensureMongoConnection, require('./routes/recovery'));
app.use('/api/ledger', ensureMongoConnection, require('./routes/ledger'));
app.use('/api/expense-ledger', ensureMongoConnection, require('./routes/expenseLedger'));
app.use('/api/daily-kharcha', ensureMongoConnection, require('./routes/dailyKharcha'));
app.use('/api/payment-method', ensureMongoConnection, require('./routes/paymentMethod'));
app.use('/api/bank', ensureMongoConnection, require('./routes/bank'));

/* =========================
   HEALTH CHECK
========================= */
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

/* =========================
   ROOT
========================= */
app.get('/', (req, res) => {
  res.json({ message: 'Manditrade Backend API' });
});

/* =========================
   LOCAL SERVER
========================= */
if (!process.env.VERCEL && require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
