const express = require('express');
const router = express.Router();
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
    const customer = new Customer({ phone, name, email, address, password });
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
    const customer = await Customer.findOne({ phone, password });
    if (!customer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful', customer });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
