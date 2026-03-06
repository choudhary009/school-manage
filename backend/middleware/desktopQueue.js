const path = require('path');

// Only enabled when running inside the Electron desktop app.
const ENABLED = process.env.DESKTOP_QUEUE_ENABLED === '1';

// Only queue mutating data routes (avoid login/auth routes).
const ALLOWED_PREFIXES = [
  '/api/sale',
  '/api/bill',
  '/api/recovery',
  '/api/ledger',
  '/api/expense-ledger',
  '/api/daily-kharcha',
  '/api/bank',
  '/api/payment-method'
];

function shouldQueue(req) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return false;
  const p = req.path || '';
  return ALLOWED_PREFIXES.some((prefix) => p.startsWith(prefix));
}

let enqueueRequest = null;
if (ENABLED) {
  try {
    const syncQueuePath = path.join(
      __dirname,
      '..',
      '..',
      'Desktop',
      'electron',
      'syncQueue'
    );
    ({ enqueueRequest } = require(syncQueuePath));
  } catch (err) {
    console.error(
      '[DesktopQueue] Failed to load desktop syncQueue module:',
      err.message || err
    );
  }
}

module.exports = async function desktopQueueMiddleware(req, res, next) {
  if (!ENABLED || !enqueueRequest) return next();

  try {
    if (!shouldQueue(req)) return next();

    const authHeader = req.headers['authorization'] || null;
    let companyId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.decode(token);
        if (decoded && decoded.id) {
          companyId = decoded.id;
        }
      } catch (err) {
        // ignore
      }
    }

    await enqueueRequest({
      method: req.method,
      path: req.originalUrl || req.path,
      body: req.body || {},
      authHeader,
      companyId
    });

    // Try to trigger an immediate sync in the background
    try {
      const syncServicePath = path.join(__dirname, '..', '..', 'Desktop', 'electron', 'syncService');
      const { syncOnce } = require(syncServicePath);
      syncOnce().catch(() => { }); // fire and forget
    } catch (e) {
      // ignore
    }
  } catch (err) {
    console.error('[DesktopQueue] enqueue failed:', err.message || err);
  }

  next();
};

