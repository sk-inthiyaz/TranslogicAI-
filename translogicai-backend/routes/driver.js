const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Driver = require('../models/Driver');

// Multer config for licence file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Driver Signup (OTP verification is static '1234' for demo)
router.post('/signup', upload.single('licenceFile'), async (req, res) => {
  try {
    const {
      phone,
      fullName,
      password,
      licenceNumber,
      address,
      city,
      state,
      pincode,
      dob
    } = req.body;

    // Validate required fields
    if (!phone || !fullName || !password || !licenceNumber || !address || !city || !state || !pincode || !dob || !req.file) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if driver already exists
    const existing = await Driver.findOne({ phone });
    if (existing) {
      return res.status(409).json({ error: 'Driver already exists' });
    }

    // Create new driver
    const driver = new Driver({
      phone,
      fullName,
      password,
      licenceNumber,
      licenceFile: req.file.path,
      address,
      city,
      state,
      pincode,
      dob: new Date(dob)
    });

    await driver.save();
    res.status(201).json({ message: 'Driver registered successfully' });
  } catch (err) {
    console.error('Driver signup error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Driver Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    const driver = await Driver.findOne({ phone, password });
    if (!driver) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Send driver data without sensitive information
    const { password: _, ...driverData } = driver.toObject();
    res.json({ message: 'Login successful', driver: driverData });
  } catch (err) {
    console.error('Driver login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
