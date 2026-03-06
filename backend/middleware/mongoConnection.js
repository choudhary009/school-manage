const mongoose = require('mongoose');

/**
 * Middleware to ensure MongoDB connection is ready before handling requests
 * Returns 503 if database is not connected
 */
async function ensureMongoConnection(req, res, next) {
  try {
    // Check connection state
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const readyState = mongoose.connection.readyState;

    if (readyState === 1) {
      // Already connected
      return next();
    }

    if (readyState === 0) {
      // Not connected - try to connect
      console.log('MongoDB not connected, attempting to connect...');
      try {
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 60000,
          connectTimeoutMS: 30000,
        });
        console.log('MongoDB connected via middleware');
        return next();
      } catch (connectError) {
        console.error('MongoDB connection failed in middleware:', connectError.message);
        return res.status(503).json({
          message: 'Database connection unavailable. Please try again in a moment.',
          error: 'MongoDB connection failed',
          details: connectError.message
        });
      }
    }

    if (readyState === 2) {
      // Connecting - wait a bit
      console.log('MongoDB is connecting, waiting...');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000); // Wait max 10 seconds

        mongoose.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });

        mongoose.connection.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      return next();
    }

    // If we get here, connection state is unexpected
    console.error('Unexpected MongoDB connection state:', readyState);
    return res.status(503).json({
      message: 'Database connection error. Please try again.',
      error: 'Unexpected connection state',
      state: readyState
    });

  } catch (error) {
    console.error('MongoDB connection check error:', error.message);
    return res.status(503).json({
      message: 'Database connection error. Please try again.',
      error: error.message
    });
  }
}

module.exports = ensureMongoConnection;

