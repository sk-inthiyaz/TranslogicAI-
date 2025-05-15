const express = require('express');
const multer = require('multer');
const path = require('path');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const mongoose = require('mongoose');

console.log('vehicle.js loaded');

// Helper function to convert file paths to web-accessible URLs
function normalizeFilePath(filePath) {
  if (!filePath) return null;
  try {
    // Handle both Windows and Unix-style paths
    const normalizedPath = filePath.replace(/\\/g, '/');
    // Get the part after 'uploads/'
    const parts = normalizedPath.split('uploads/');
    if (parts.length < 2) {
      // If 'uploads/' is not in the path, just return the filename
      return path.basename(filePath);
    }
    return parts[1]; // Return everything after 'uploads/'
  } catch (err) {
    console.error('Error normalizing file path:', err, 'Path:', filePath);
    // Return just the filename as fallback
    return path.basename(filePath);
  }
}

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
  { name: 'tax', maxCount: 1 }
]), async (req, res) => {
  try {
    const { driverId, vehicleNumber, vehicleName, capacity, driverName } = req.body;
    const files = req.files;
    if (!driverId || !vehicleNumber || !vehicleName || !capacity || !driverName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store relative paths instead of absolute paths
    const filePaths = {
      permit: files.permit?.[0] ? normalizeFilePath(files.permit[0].path) : null,
      rc: files.rc?.[0] ? normalizeFilePath(files.rc[0].path) : null,
      fitness: files.fitness?.[0] ? normalizeFilePath(files.fitness[0].path) : null,
      puc: files.puc?.[0] ? normalizeFilePath(files.puc[0].path) : null,
      insurance: files.insurance?.[0] ? normalizeFilePath(files.insurance[0].path) : null,
      vehicleImage: files.vehicleImage?.[0] ? normalizeFilePath(files.vehicleImage[0].path) : null,
      driverLicence: files.driverLicence?.[0] ? normalizeFilePath(files.driverLicence[0].path) : null,
      driverImage: files.driverImage?.[0] ? normalizeFilePath(files.driverImage[0].path) : null,
      tax: files.tax?.[0] ? normalizeFilePath(files.tax[0].path) : null,
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

// Get all vehicles with driver details (for dashboard)
router.get('/list/all', async (req, res) => {
  console.log('--- /list/all route hit ---');
  try {
    console.log('Starting vehicle list fetch...');
    console.log('Database state:', mongoose.connection.readyState);
    
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. State:', mongoose.connection.readyState);
      console.error('Returning error: Database connection not ready');
      throw new Error('Database connection not ready');
    }
    
    console.log('Database connection verified, attempting to fetch vehicles...');

    // Fetch vehicles and populate driverId
    let vehicles;
    try {
      vehicles = await Vehicle.find({})
        .populate('driverId', 'fullName phone')
        .lean()
        .exec();
      console.log('Vehicle.find().populate() executed. Vehicles:', vehicles.length);
    } catch (popErr) {
      console.error('Error during Vehicle.find().populate:', popErr);
      console.error('Returning error: Error populating driver details');
      return res.status(500).json({ error: 'Error populating driver details', details: popErr.message });
    }

    if (!vehicles || vehicles.length === 0) {
      console.warn('No vehicles found in the database.');
      console.warn('Returning error: No vehicles found');
      return res.status(404).json({ error: 'No vehicles found' });
    }

    // Check for population issues
    const populationErrors = vehicles.filter(v => !v.driverId || !v.driverId.fullName);
    if (populationErrors.length > 0) {
      console.warn('Some vehicles have missing or mismatched driver references:', populationErrors.map(v => v._id));
      // Optionally, return a warning in the response
      // return res.status(500).json({ error: 'Some vehicles have missing driver references', vehicleIds: populationErrors.map(v => v._id) });
    }

    // Log a sample vehicle for debugging
    console.log('Vehicles found:', vehicles.length);
    if (vehicles.length > 0) {
      console.log('Sample vehicle data:', JSON.stringify({
        _id: vehicles[0]._id,
        driverId: vehicles[0].driverId,
        vehicleNumber: vehicles[0].vehicleNumber,
        files: vehicles[0].files
      }, null, 2));
    }

    const enrichedVehicles = vehicles.map(vehicle => ({
      id: vehicle._id,
      ownerName: vehicle.driverId?.fullName || 'Unknown',
      driverName: vehicle.files?.driverName || 'Unknown',
      vehicleNumber: vehicle.vehicleNumber,
      vehicleName: vehicle.vehicleName,
      capacity: vehicle.capacity,
      status: vehicle.status,
      documents: {
        permit: normalizeFilePath(vehicle.files?.permit),
        rc: normalizeFilePath(vehicle.files?.rc),
        fitness: normalizeFilePath(vehicle.files?.fitness),
        puc: normalizeFilePath(vehicle.files?.puc),
        insurance: normalizeFilePath(vehicle.files?.insurance),
        vehicleImage: normalizeFilePath(vehicle.files?.vehicleImage),
        driverLicence: normalizeFilePath(vehicle.files?.driverLicence),
        driverImage: normalizeFilePath(vehicle.files?.driverImage),
        tax: normalizeFilePath(vehicle.files?.tax)
      },
      phone: vehicle.driverId?.phone || 'Unknown'
    }));

    console.log('Successfully processed vehicles. Count:', enrichedVehicles.length);
    console.log('Returning successful response for /list/all');
    return res.json({ vehicles: enrichedVehicles });
  } catch (err) {
    console.error('Error in /list/all endpoint:', {
      error: err.toString(),
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack,
      env: process.env.NODE_ENV
    });
    if (err.stack) {
      console.error('Full error stack:', err.stack);
    }
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
      console.error('Returning MongoDB error response:', err);
      return res.status(500).json({
        error: 'Database error',
        details: 'There was an error accessing the database',
        code: err.code
      });
    }
    if (err.name === 'ValidationError') {
      console.error('Returning Validation error response:', err);
      return res.status(400).json({
        error: 'Validation error',
        details: err.message
      });
    }
    console.error('Returning generic server error response:', err);
    return res.status(500).json({
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
      type: err.name
    });
  }
});

// Update vehicle status
router.put('/list/all/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Activated', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Status updated successfully', vehicle });
  } catch (err) {
    console.error('Error updating vehicle status:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
