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
router.get('/list/driver/:driverId', async (req, res) => {
  try {
    const driverId = req.params.driverId;
    console.log('Fetching vehicles for driverId:', driverId);

    // Try to cast to ObjectId if possible
    let queryDriverId = driverId;
    if (mongoose.Types.ObjectId.isValid(driverId)) {
      queryDriverId = new mongoose.Types.ObjectId(driverId);
    }

    const vehicles = await Vehicle.find({ driverId: queryDriverId });
    console.log('Vehicles found for driver:', vehicles.length);

    if (!vehicles || vehicles.length === 0) {
      return res.status(404).json({ error: 'No vehicles found' });
    }

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

// Get vehicle by ID (for MyVehicles page)
router.get('/list/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('driverId', 'fullName phone').lean();
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    // Format response similar to /list/all
    const result = {
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
    };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
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

// Hardcoded city coords lookup (same table as driver.js) ────────────────────
const CITY_COORDS_V = {
  "hyderabad":17.3850,"hyderabad_lng":78.4867,
};
// Inline coords function (avoids duplicating the whole table)
function getVehicleCityCoords(cityName) {
  const CITIES = {
    "hyderabad":      { lat: 17.3850, lng: 78.4867 },
    "warangal":       { lat: 17.9784, lng: 79.6010 },
    "nizamabad":      { lat: 18.6726, lng: 78.0940 },
    "karimnagar":     { lat: 18.4386, lng: 79.1288 },
    "khammam":        { lat: 17.2473, lng: 80.1514 },
    "nalgonda":       { lat: 17.0575, lng: 79.2680 },
    "siddipet":       { lat: 18.1018, lng: 78.8520 },
    "mahbubnagar":    { lat: 16.7373, lng: 78.0001 },
    "ghatkesar":      { lat: 17.4421, lng: 78.6932 },
    "secunderabad":   { lat: 17.4399, lng: 78.4983 },
    "medak":          { lat: 18.0440, lng: 78.2646 },
    "vijayawada":     { lat: 16.5062, lng: 80.6480 },
    "visakhapatnam":  { lat: 17.6868, lng: 83.2185 },
    "vizag":          { lat: 17.6868, lng: 83.2185 },
    "guntur":         { lat: 16.3067, lng: 80.4365 },
    "nellore":        { lat: 14.4426, lng: 79.9865 },
    "kurnool":        { lat: 15.8281, lng: 78.0373 },
    "rajahmundry":    { lat: 17.0005, lng: 81.8040 },
    "tirupati":       { lat: 13.6288, lng: 79.4192 },
    "kadapa":         { lat: 14.4673, lng: 78.8242 },
    "anantapur":      { lat: 14.6819, lng: 77.6006 },
    "eluru":          { lat: 16.7107, lng: 81.0952 },
    "ongole":         { lat: 15.5057, lng: 80.0499 },
    "srikakulam":     { lat: 18.2949, lng: 83.8938 },
    "kakinada":       { lat: 16.9891, lng: 82.2475 },
    "nandyal":        { lat: 15.4786, lng: 78.4836 },
    "chittoor":       { lat: 13.2172, lng: 79.1003 },
    "chennai":        { lat: 13.0827, lng: 80.2707 },
    "coimbatore":     { lat: 11.0168, lng: 76.9558 },
    "madurai":        { lat: 9.9252,  lng: 78.1198 },
    "bangalore":      { lat: 12.9716, lng: 77.5946 },
    "bengaluru":      { lat: 12.9716, lng: 77.5946 },
    "mysore":         { lat: 12.2958, lng: 76.6394 },
    "hubli":          { lat: 15.3647, lng: 75.1240 },
    "mumbai":         { lat: 19.0760, lng: 72.8777 },
    "pune":           { lat: 18.5204, lng: 73.8567 },
    "nagpur":         { lat: 21.1458, lng: 79.0882 },
    "delhi":          { lat: 28.7041, lng: 77.1025 },
    "kolkata":        { lat: 22.5726, lng: 88.3639 },
    "ahmedabad":      { lat: 23.0225, lng: 72.5714 },
    "surat":          { lat: 21.1702, lng: 72.8311 },
    "jaipur":         { lat: 26.9124, lng: 75.7873 },
    "lucknow":        { lat: 26.8467, lng: 80.9462 },
  };
  if (!cityName) return null;
  const key = cityName.trim().toLowerCase();
  if (CITIES[key]) return CITIES[key];
  for (const [k, v] of Object.entries(CITIES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

// Update vehicle location — saves city name + lat/lng ────────────────────────
router.post('/:vehicleId/location', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { location } = req.body;
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    // Resolve city to coordinates
    const coords = getVehicleCityCoords(location);
    const update = { location: location.trim() };
    if (coords) {
      update.lat = coords.lat;
      update.lng = coords.lng;
    }

    const vehicle = await Vehicle.findByIdAndUpdate(vehicleId, update, { new: true });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    console.log(`🚛 Vehicle ${vehicle.vehicleNumber} location: ${location} → lat:${vehicle.lat}, lng:${vehicle.lng}`);
    res.json({
      message: 'Location updated',
      location: vehicle.location,
      lat: vehicle.lat,
      lng: vehicle.lng,
      coordsFound: !!(vehicle.lat && vehicle.lng),
      vehicle,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET nearby loads for a specific vehicle (by vehicle's lat/lng) ─────────────
router.get('/:vehicleId/nearby-loads', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (!vehicle.lat || !vehicle.lng) {
      return res.json({ count: 0, loads: [], warning: 'Set vehicle location first' });
    }

    const Load = require('../models/Load');
    // Haversine inline
    const hav = (lat1, lng1, lat2, lng2) => {
      const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    const allPending = await Load.find({ status: 'Pending' });
    const nearby = allPending
      .map(load => {
        const obj = load.toObject();
        // Resolve pickup coords if missing
        if (!obj.pickupLat || !obj.pickupLng) {
          const c = getVehicleCityCoords(obj.pickup);
          if (c) { obj.pickupLat = c.lat; obj.pickupLng = c.lng; }
        }
        if (!obj.pickupLat || !obj.pickupLng) return null;
        const dist = hav(vehicle.lat, vehicle.lng, obj.pickupLat, obj.pickupLng);
        return dist <= 50 ? { ...obj, distanceFromVehicle: Math.round(dist) } : null;
      })
      .filter(Boolean);

    res.json({ count: nearby.length, loads: nearby });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;

