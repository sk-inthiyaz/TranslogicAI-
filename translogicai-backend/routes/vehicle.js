const express = require('express');
const multer = require('multer');
const path = require('path');
const Vehicle = require('../models/Vehicle');

const router = express.Router();

// Multer config
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

// Add vehicle and upload documents
router.post('/add', upload.fields([
  { name: 'permit', maxCount: 1 },
  { name: 'rc', maxCount: 1 },
  { name: 'fitness', maxCount: 1 },
  { name: 'puc', maxCount: 1 },
  { name: 'insurance', maxCount: 1 },
  { name: 'vehicleImage', maxCount: 1 },
  { name: 'driverLicence', maxCount: 1 },
  { name: 'driverImage', maxCount: 1 },
  { name: 'tax', maxCount: 1 } // Add tax document field
]), async (req, res) => {
  try {
    const { driverId, vehicleNumber, vehicleName, capacity, driverName } = req.body;
    const files = req.files;
    if (!driverId || !vehicleNumber || !vehicleName || !capacity || !driverName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const filePaths = {
      permit: files.permit?.[0]?.path,
      rc: files.rc?.[0]?.path,
      fitness: files.fitness?.[0]?.path,
      puc: files.puc?.[0]?.path,
      insurance: files.insurance?.[0]?.path,
      vehicleImage: files.vehicleImage?.[0]?.path,
      driverLicence: files.driverLicence?.[0]?.path,
      driverImage: files.driverImage?.[0]?.path,
      tax: files.tax?.[0]?.path, // Save tax document path
      driverName
    };
    const vehicle = new Vehicle({
      driverId,
      vehicleNumber,
      vehicleName,
      capacity,
      files: filePaths
    });
    await vehicle.save();
    res.status(201).json({ message: 'Vehicle and documents uploaded', vehicle });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get all vehicles for a driver
router.get('/list/:driverId', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ driverId: req.params.driverId });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
