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

// Multer config for profile photo upload
const photoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const photoUpload = multer({ storage: photoStorage });

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
    // Return driver data including Owner Name (fullName)
    const { password: _, ...driverData } = driver.toObject();
    res.status(201).json({ 
      message: 'Driver registered successfully',
      driver: driverData,
      ownerName: driverData.fullName
    });
  } catch (err) {
    console.error('Driver signup error:', err);
    res.status(500).json({ error: 'Server error', details: err }); // Return full error object for debugging
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

// Update driver profile photo
router.post('/profile/photo', photoUpload.single('photo'), async (req, res) => {
  try {
    // Assume driver is authenticated and driverId is sent in body (for demo)
    const { driverId } = req.body;
    if (!driverId || !req.file) {
      return res.status(400).json({ error: 'Driver ID and photo are required' });
    }
    const photoPath = '/uploads/' + req.file.filename;
    const driver = await Driver.findByIdAndUpdate(driverId, { photo: photoPath }, { new: true });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ message: 'Photo updated', photo: photoPath });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get driver profile (basic info + photo)
router.get('/profile', async (req, res) => {
  try {
    // For demo, get driverId from query param
    const { driverId } = req.query;
    if (!driverId) return res.status(400).json({ error: 'Driver ID required' });
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    // Count vehicles (if you have a Vehicle model)
    let vehiclesCount = 0;
    // Optionally, count vehicles here if needed
    res.json({
      name: driver.fullName,
      email: driver.email || '',
      phone: driver.phone,
      vehicles: vehiclesCount,
      photo: driver.photo
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Haversine distance (km) between two lat/lng points ─────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Hardcoded city coordinates lookup (reliable, no API needed) ─────────────
const CITY_COORDS = {
  // Telangana
  "hyderabad":      { lat: 17.3850, lng: 78.4867 },
  "warangal":       { lat: 17.9784, lng: 79.6010 },
  "nizamabad":      { lat: 18.6726, lng: 78.0940 },
  "karimnagar":     { lat: 18.4386, lng: 79.1288 },
  "khammam":        { lat: 17.2473, lng: 80.1514 },
  "nalgonda":       { lat: 17.0575, lng: 79.2680 },
  "siddipet":       { lat: 18.1018, lng: 78.8520 },
  "mahbubnagar":    { lat: 16.7373, lng: 78.0001 },
  "adilabad":       { lat: 19.6641, lng: 78.5320 },
  "suryapet":       { lat: 17.1413, lng: 79.6206 },
  "miryalaguda":    { lat: 16.8726, lng: 79.5626 },
  "ghatkesar":      { lat: 17.4421, lng: 78.6932 },
  "secunderabad":   { lat: 17.4399, lng: 78.4983 },
  "medak":          { lat: 18.0440, lng: 78.2646 },
  // Andhra Pradesh
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
  "bhimavaram":     { lat: 16.5442, lng: 81.5222 },
  "machilipatnam":  { lat: 16.1875, lng: 81.1341 },
  "kakinada":       { lat: 16.9891, lng: 82.2475 },
  "proddatur":      { lat: 14.7502, lng: 78.5481 },
  "hindupur":       { lat: 13.8290, lng: 77.4910 },
  "chittoor":       { lat: 13.2172, lng: 79.1003 },
  "nandyal":        { lat: 15.4786, lng: 78.4836 },
  // Tamil Nadu
  "chennai":        { lat: 13.0827, lng: 80.2707 },
  "coimbatore":     { lat: 11.0168, lng: 76.9558 },
  "madurai":        { lat: 9.9252,  lng: 78.1198 },
  "trichy":         { lat: 10.7905, lng: 78.7047 },
  "salem":          { lat: 11.6643, lng: 78.1460 },
  "tirunelveli":    { lat: 8.7139,  lng: 77.7567 },
  // Karnataka
  "bangalore":      { lat: 12.9716, lng: 77.5946 },
  "bengaluru":      { lat: 12.9716, lng: 77.5946 },
  "mysore":         { lat: 12.2958, lng: 76.6394 },
  "hubli":          { lat: 15.3647, lng: 75.1240 },
  "mangalore":      { lat: 12.9141, lng: 74.8560 },
  "belgaum":        { lat: 15.8497, lng: 74.4977 },
  // Maharashtra
  "mumbai":         { lat: 19.0760, lng: 72.8777 },
  "pune":           { lat: 18.5204, lng: 73.8567 },
  "nagpur":         { lat: 21.1458, lng: 79.0882 },
  "nashik":         { lat: 19.9975, lng: 73.7898 },
  "aurangabad":     { lat: 19.8762, lng: 75.3433 },
  "solapur":        { lat: 17.6805, lng: 75.9064 },
  // Delhi / NCR
  "delhi":          { lat: 28.7041, lng: 77.1025 },
  "new delhi":      { lat: 28.6139, lng: 77.2090 },
  "gurgaon":        { lat: 28.4595, lng: 77.0266 },
  "noida":          { lat: 28.5355, lng: 77.3910 },
  // West Bengal
  "kolkata":        { lat: 22.5726, lng: 88.3639 },
  // Gujarat
  "ahmedabad":      { lat: 23.0225, lng: 72.5714 },
  "surat":          { lat: 21.1702, lng: 72.8311 },
  "vadodara":       { lat: 22.3072, lng: 73.1812 },
  // Rajasthan
  "jaipur":         { lat: 26.9124, lng: 75.7873 },
  // UP
  "lucknow":        { lat: 26.8467, lng: 80.9462 },
  "kanpur":         { lat: 26.4499, lng: 80.3319 },
  "agra":           { lat: 27.1767, lng: 78.0081 },
};

// Get coords from lookup (normalise to lowercase)
function getCityCoords(cityName) {
  if (!cityName) return null;
  const key = cityName.trim().toLowerCase();
  // Direct match
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  // Partial match — city name contains a known key
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

// Update driver location (hardcoded lookup first, then ORS fallback) ─────────
const axios = require('axios');
router.post('/location', async (req, res) => {
  try {
    const { driverId, location } = req.body;
    if (!driverId || !location) return res.status(400).json({ error: 'driverId and location required' });

    // Try hardcoded lookup first (instant, reliable)
    let coords = getCityCoords(location);

    // If city not in our list, try ORS API as fallback
    if (!coords) {
      try {
        const orsRes = await axios.get('https://api.openrouteservice.org/geocode/search', {
          params: { api_key: process.env.Directions_API_KEY, text: location.trim() + ', India', size: 1 },
          timeout: 5000,
        });
        const c = orsRes.data.features?.[0]?.geometry?.coordinates;
        if (c) coords = { lat: c[1], lng: c[0] };
      } catch { /* ORS failed, coords stays null */ }
    }

    const update = { location: location.trim(), isAvailable: true };
    if (coords) {
      update.lat = coords.lat;
      update.lng = coords.lng;
    }

    const driver = await Driver.findByIdAndUpdate(driverId, update, { new: true });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    console.log(`✅ Driver location set: ${location} → lat:${driver.lat}, lng:${driver.lng}`);
    res.json({
      message: 'Location updated',
      location: driver.location,
      lat: driver.lat,
      lng: driver.lng,
      coordsFound: !!(driver.lat && driver.lng),
    });
  } catch (err) {
    console.error('Location update error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Get pending loads — filtered by ALL driver vehicles' locations ──────────────
const Load    = require('../models/Load');
const Vehicle = require('../models/Vehicle');
router.get('/pending-loads', async (req, res) => {
  try {
    const { driverId } = req.query;
    if (!driverId) return res.status(400).json({ error: 'driverId required' });

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    // Collect coordinate sources from ALL activated vehicles with location set
    const vehicles = await Vehicle.find({
      driverId,
      status: 'Activated',
      lat: { $exists: true, $ne: null },
      lng: { $exists: true, $ne: null },
    });

    // Build coord sources list
    const coordSources = vehicles.map(v => ({
      lat:           v.lat,
      lng:           v.lng,
      vehicleId:     v._id.toString(),
      vehicleNumber: v.vehicleNumber,
      vehicleName:   v.vehicleName,
    }));

    // Also include driver profile coords as fallback (if set)
    if (driver.lat && driver.lng && coordSources.length === 0) {
      coordSources.push({
        lat: driver.lat, lng: driver.lng,
        vehicleId: null, vehicleNumber: 'Driver Profile', vehicleName: '',
      });
    }

    if (coordSources.length === 0) {
      return res.json({
        noCoords: true,
        loads: [],
        warning: 'No vehicle locations set. Go to My Vehicles and update each vehicle\'s location.',
      });
    }

    // Fetch all pending loads not rejected by this driver
    const allLoads = await Load.find({
      status: 'Pending',
      rejectedBy: { $nin: [driverId] },
    }).sort({ createdAt: -1 });

    // Resolve pickup coords for any load missing them
    const loadsWithCoords = allLoads.map(load => {
      const obj = load.toObject();
      if (!obj.pickupLat || !obj.pickupLng) {
        const c = getCityCoords(obj.pickup);
        if (c) { obj.pickupLat = c.lat; obj.pickupLng = c.lng; }
      }
      return obj;
    });

    // For each load, find which vehicles are within 50km of the pickup
    const result = loadsWithCoords
      .map(load => {
        if (!load.pickupLat || !load.pickupLng) return null;
        const nearbyVehicles = coordSources
          .map(src => {
            const dist = haversine(src.lat, src.lng, load.pickupLat, load.pickupLng);
            return dist <= 50
              ? { ...src, distanceKm: Math.round(dist) }
              : null;
          })
          .filter(Boolean)
          .sort((a, b) => a.distanceKm - b.distanceKm); // nearest first

        if (nearbyVehicles.length === 0) return null;

        return {
          ...load,
          nearbyVehicles,                             // which vehicles can take this load
          distanceFromDriver: nearbyVehicles[0].distanceKm, // closest vehicle distance
        };
      })
      .filter(Boolean);

    const vNames = coordSources.map(s => `${s.vehicleNumber}(${s.lat?.toFixed(2)},${s.lng?.toFixed(2)})`).join(', ');
    console.log(`🚛 Vehicles: [${vNames}] | ${allLoads.length} total loads → ${result.length} matched`);
    res.json(result);
  } catch (err) {
    console.error('Pending loads error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Accept a load ────────────────────────────────────────────────────────────
router.post('/accept-load', async (req, res) => {
  try {
    const { driverId, loadId, vehicleId } = req.body;
    if (!driverId || !loadId) return res.status(400).json({ error: 'driverId and loadId required' });
    const load = await Load.findById(loadId);
    if (!load) return res.status(404).json({ error: 'Load not found' });
    if (load.status !== 'Pending') return res.status(409).json({ error: 'Load is no longer available' });
    load.status           = 'Assigned';
    load.assignedDriverId = driverId;
    if (vehicleId) load.assignedVehicleId = vehicleId;
    await load.save();
    // Mark driver as busy
    await Driver.findByIdAndUpdate(driverId, { isAvailable: false });
    console.log(`✅ Load ${loadId} accepted by driver ${driverId}${vehicleId ? ' with vehicle ' + vehicleId : ''}`);
    res.json({ message: 'Load accepted successfully', load });
  } catch (err) {
    console.error('Accept load error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Reject a load ─────────────────────────────────────────────────────────────
router.post('/reject-load', async (req, res) => {
  try {
    const { driverId, loadId } = req.body;
    if (!driverId || !loadId) return res.status(400).json({ error: 'driverId and loadId required' });
    const load = await Load.findByIdAndUpdate(
      loadId,
      { $addToSet: { rejectedBy: driverId } },
      { new: true }
    );
    if (!load) return res.status(404).json({ error: 'Load not found' });
    res.json({ message: 'Load rejected', load });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Get my accepted loads ─────────────────────────────────────────────────────
router.get('/my-loads', async (req, res) => {
  try {
    const { driverId } = req.query;
    if (!driverId) return res.status(400).json({ error: 'driverId required' });
    const loads = await Load.find({ assignedDriverId: driverId }).sort({ createdAt: -1 });
    res.json(loads);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
