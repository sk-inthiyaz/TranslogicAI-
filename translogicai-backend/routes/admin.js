const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Simple in-memory token store (resets on server restart — fine for admin)
const validTokens = new Set();

// POST /api/admin/login — validate credentials from .env
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('❌ ADMIN_EMAIL or ADMIN_PASSWORD not set in .env');
    return res.status(500).json({ error: 'Admin credentials not configured on server' });
  }

  if (email.trim().toLowerCase() !== adminEmail.trim().toLowerCase() || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Generate a random session token
  const token = crypto.randomBytes(32).toString('hex');
  validTokens.add(token);

  // Auto-expire token after 24 hours
  setTimeout(() => validTokens.delete(token), 24 * 60 * 60 * 1000);

  console.log('✅ Admin logged in successfully');
  res.json({
    message: 'Login successful',
    token,
    admin: { email: adminEmail, name: 'Admin' }
  });
});

// GET /api/admin/verify — check if token is valid
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (validTokens.has(token)) {
    return res.json({ valid: true, admin: { email: process.env.ADMIN_EMAIL, name: 'Admin' } });
  }

  return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
});

// POST /api/admin/logout — invalidate token
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    validTokens.delete(token);
  }
  res.json({ message: 'Logged out successfully' });
});

// GET /api/admin/stats — dashboard summary statistics
router.get('/stats', async (req, res) => {
  // Quick auth check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || !validTokens.has(authHeader.split(' ')[1])) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const Driver = require('../models/Driver');
    const Vehicle = require('../models/Vehicle');
    const Load = require('../models/Load');
    const Customer = require('../models/Customer');

    const [totalDrivers, totalVehicles, totalLoads, totalCustomers, pendingLoads, assignedLoads] = await Promise.all([
      Driver.countDocuments(),
      Vehicle.countDocuments(),
      Load.countDocuments(),
      Customer.countDocuments(),
      Load.countDocuments({ status: 'Pending' }),
      Load.countDocuments({ status: 'Assigned' }),
    ]);

    res.json({
      totalDrivers,
      totalVehicles,
      totalLoads,
      totalCustomers,
      pendingLoads,
      assignedLoads,
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
