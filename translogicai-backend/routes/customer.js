const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Customer = require('../models/Customer');

// Customer Sign Up (OTP is always 1234 for demo)
router.post('/signup', async (req, res) => {
  const { phone, name, email, address, password } = req.body;
  if (!phone || !name || !address || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // Check if customer already exists
    const existing = await Customer.findOne({ phone });
    if (existing) {
      return res.status(409).json({ error: 'Customer already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = new Customer({ phone, name, email, address, password: hashedPassword });
    await customer.save();
    res.status(201).json({ message: 'Customer registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Customer Login
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Missing phone or password' });
  }
  try {
    const customer = await Customer.findOne({ phone });
    if (!customer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful', customer });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Get customer profile ────────────────────────────────────────────────────
router.get('/profile/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password');
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update customer profile ─────────────────────────────────────────────────
router.put('/profile/:id', async (req, res) => {
  try {
    const { name, email, address } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, email, address },
      { new: true, runValidators: true }
    ).select('-password');
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Profile updated', customer });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ── Get customer's bookings ─────────────────────────────────────────────────
const Load = require('../models/Load');
router.get('/bookings/:phone', async (req, res) => {
  try {
    const loads = await Load.find({ customerPhone: req.params.phone })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(loads);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
