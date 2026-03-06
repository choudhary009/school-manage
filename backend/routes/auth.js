const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const CompanyDeviceSession = require('../models/CompanyDeviceSession');
const Admin = require('../models/Admin');
const ensureMongoConnection = require('../middleware/mongoConnection');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role || 'company' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Company Login
router.post('/company/login', ensureMongoConnection, async (req, res) => {
  try {

    const { email, password, mode, passKey, offlinePassKey, onlinePassKey } = req.body; // mode: 'online' | 'offline'

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.trim().toLowerCase();
    const authMode = mode === 'offline' ? 'offline' : 'online';

    console.log(`Login attempt for email: ${normalizedEmail}`);

    // Find company by email (case-insensitive)
    let company = await Company.findOne({ email: normalizedEmail });

    // --- NEW: OFFLINE-FIRST HYBRID LOGIN ---
    if (!company) {
      // If user is explicitly trying offline mode, we cannot fetch from cloud.
      if (authMode === 'offline') {
        return res.status(401).json({
          message:
            'Company not found in offline database. Please connect to internet once and login to initialize offline access.'
        });
      }

      console.log(`Company not found locally for: ${normalizedEmail}. Trying cloud auth...`);
      try {
        const axios = require('axios');
        // We try to authenticate with your live server
        const cloudResponse = await axios.post('https://mandi-trade-backend.vercel.app/api/auth/company/login', {
          email, password
        }, { timeout: 10000 });

        if (cloudResponse.status === 200) {
          console.log('Cloud authentication success! Syncing user to local DB...');
          const cloudData = cloudResponse.data.company;
          const cloudId = cloudData?._id || cloudData?.id || null;

          // Save this user to local database so they can login offline next time
          company = new Company({
            ...cloudData,
            ...(cloudId ? { _id: cloudId } : {}),
            email: normalizedEmail,
            password: password, // The model will hash it on save
            isActive: true,
            // Seed passkeys into the local DB (desktop only).
            offlinePassKey: offlinePassKey || '',
            onlinePassKey: onlinePassKey || passKey || '',
            cloudToken: cloudResponse.data.token // Store for background sync
          });
          await company.save();
          console.log('User synced locally with cloud token.');
        }
      } catch (cloudErr) {
        console.log('Cloud authentication failed or offline:', cloudErr.message);
        return res.status(401).json({ message: 'Invalid email or password (or you are offline)' });
      }
    } else {
      // If Electron sent passkeys, store them locally (so offline login works later).
      // Only set if missing, to avoid silently changing keys.
      const keysChanged =
        (offlinePassKey && !company.offlinePassKey) ||
        (onlinePassKey && !company.onlinePassKey);
      if (keysChanged) {
        if (offlinePassKey && !company.offlinePassKey) company.offlinePassKey = offlinePassKey;
        if (onlinePassKey && !company.onlinePassKey) company.onlinePassKey = onlinePassKey;
        await company.save().catch(() => {});
      }

      // If company exists but we are online, update the cloudToken to keep it fresh
      if (authMode === 'online' && !passKey) {
        try {
          const axios = require('axios');
          const cloudResponse = await axios.post('https://mandi-trade-backend.vercel.app/api/auth/company/login', {
            email, password
          }, { timeout: 10000 });
          if (cloudResponse.status === 200) {
            company.cloudToken = cloudResponse.data.token;
            await company.save();
            console.log('Cloud token updated for background sync.');
          }
        } catch (e) {
          // ignore
        }
      }
    }

    if (!company) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!company.isActive) {
      console.log(`Company account is inactive: ${normalizedEmail}`);
      return res.status(401).json({ message: 'Company account is deactivated. Please contact administrator.' });
    }

    const now = new Date();

    if (authMode === 'offline') {
      if (!company.offlinePassKey || company.offlinePassKey !== passKey) {
        return res
          .status(401)
          .json({ message: 'Invalid offline pass key' });
      }
      if (
        company.offlinePassKeyExpiresAt &&
        company.offlinePassKeyExpiresAt < now
      ) {
        return res
          .status(401)
          .json({ message: 'Offline pass key expired. Contact admin.' });
      }
    } else if (authMode === 'online' && passKey) {
      if (!company.onlinePassKey || company.onlinePassKey !== passKey) {
        return res
          .status(401)
          .json({ message: 'Invalid online pass key' });
      }
      if (
        company.onlinePassKeyExpiresAt &&
        company.onlinePassKeyExpiresAt < now
      ) {
        return res
          .status(401)
          .json({ message: 'Online pass key expired. Contact admin.' });
      }
    } else {
      // Fallback: normal password login
      const isMatch = await company.comparePassword(password);
      if (!isMatch) {
        console.log(`Password mismatch for company: ${company.username}`);
        return res
          .status(401)
          .json({ message: 'Invalid email or password' });
      }
    }

    console.log(
      `Login successful for company: ${company.username} (${authMode})`
    );

    // Generate token
    const token = generateToken({
      ...company.toObject(),
      role: 'company',
      mode: authMode
    });

    if (!token) {
      console.error('Token generation failed');
      return res.status(500).json({ message: 'Failed to generate authentication token' });
    }

    // Update pending queued requests to use the latest token so they can
    // sync immediately when internet comes back.
    try {
      if (process.env.DESKTOP_QUEUE_ENABLED === '1') {
        const path = require('path');
        const syncQueuePath = path.join(
          __dirname,
          '..',
          '..',
          'Desktop',
          'electron',
          'syncQueue'
        );
        const { updatePendingAuthHeader } = require(syncQueuePath);
        await updatePendingAuthHeader({
          companyId: company._id,
          authHeader: `Bearer ${token}`
        });
      }
    } catch (e) {
      // ignore
    }

    // Log device/session info for admin visibility
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket.remoteAddress ||
      null;
    const userAgent = req.headers['user-agent'] || '';
    const appVersion = req.headers['x-app-version'] || null;

    let os = null;
    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/mac os/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';

    CompanyDeviceSession.create({
      companyId: company._id,
      mode: authMode,
      ip,
      userAgent,
      os,
      appVersion
    }).catch(() => { });

    res.json({
      message: 'Login successful',
      token,
      company: {
        id: company._id,
        username: company.username,
        email: company.email,
        shopName: company.shopName,
        logo: company.logo,
        address: company.address,
        persons: company.persons,
        dashboardType: company.dashboardType,
        websiteLanguage: company.websiteLanguage,
        pagePermissions: company.pagePermissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Login
router.post('/admin/login', ensureMongoConnection, async (req, res) => {
  try {

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.trim().toLowerCase();

    console.log(`Admin login attempt for email: ${normalizedEmail}`);

    // Find admin by normalized email
    const admin = await Admin.findOne({ email: normalizedEmail });

    if (!admin) {
      console.log(`Admin not found for email: ${normalizedEmail}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`Admin found: ${admin.username}`);

    // Check password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      console.log(`Password mismatch for admin: ${admin.username}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`Login successful for admin: ${admin.username}`);

    // Generate token
    const token = generateToken({ ...admin.toObject(), role: 'super_admin' });

    if (!token) {
      console.error('Token generation failed');
      return res.status(500).json({ message: 'Failed to generate authentication token' });
    }

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

