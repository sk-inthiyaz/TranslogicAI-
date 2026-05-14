const express = require("express");
const axios = require("axios");
const router = express.Router();
const calculatePrice = require("../utils/calculatePrice");
const getWeather = require("../utils/getWeather");
const Load = require('../models/Load');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DAPI_KEY = process.env.Directions_API_KEY;

// Coordinates from OpenRouteService
async function getCoordinates(place) {
  const response = await axios.get("https://api.openrouteservice.org/geocode/search", {
    params: {
      api_key: DAPI_KEY,
      text: place,
      size: 1,
    },
  });

  const coords = response.data.features?.[0]?.geometry?.coordinates;
  if (!coords) throw new Error(`Could not get coordinates for ${place}`);
  return coords;
}

router.post("/", async (req, res) => {
  const { pickup, drop, weight, urgency, cargo, customerName, customerPhone } = req.body;

  if (!pickup || !drop || !weight || !urgency || !cargo || !customerName || !customerPhone) {
    return res.status(400).json({ reply: "All fields are required." });
  }

  try {
    const [pickupCoords, dropCoords] = await Promise.all([
      getCoordinates(pickup),
      getCoordinates(drop),
    ]);

    const routeResponse = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      { coordinates: [pickupCoords, dropCoords] },
      {
        headers: {
          Authorization: DAPI_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const summary = routeResponse.data.features?.[0]?.properties?.summary;
    const geometry = routeResponse.data.features?.[0]?.geometry;

    if (!summary || !geometry) {
      return res.status(500).json({ reply: "Could not get route summary." });
    }

    const distance = summary.distance / 1000;
    const duration = summary.duration / 60;

    const weather = await getWeather(pickup);
    const price = calculatePrice(distance, weight, urgency, weather);

    const prompt = `Pickup: ${pickup}, Drop: ${drop}, Weight: ${weight}kg, Urgency: ${urgency}, Weather: ${weather}. Suggest best delivery method with price ₹${price}.`;

    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    const reply =
      geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No smart suggestion available.";

    // ✅ Quote only — do NOT save to DB here.
    // The load is saved only when customer confirms via POST /api/logistics/book
    res.json({
      reply,
      price,
      routeData: geometry,
      eta: Math.round(duration),
      carbon: (distance * 0.21).toFixed(2),
      vehicle: urgency === "High" ? "Bike" : "Van",
      // Return coords so frontend can pass them to /book
      pickupLat: pickupCoords[1],
      pickupLng: pickupCoords[0],
      distanceKm: distance,
    });
  } catch (err) {
    console.error("❌ Error in logistics:", err.message);
    res.status(500).json({ reply: "Internal server error in logistics." });
  }
});

// ── POST /book — Customer confirms booking, load saved as Pending ─────────────
// Called ONLY when customer clicks "Book Truck Now"
router.post("/book", async (req, res) => {
  const { pickup, drop, weight, urgency, cargo, customerName, customerPhone,
          price, distanceKm, pickupLat, pickupLng } = req.body;

  if (!pickup || !drop || !weight || !urgency) {
    return res.status(400).json({ error: "Missing required booking fields." });
  }

  try {
    // If coords weren't passed, geocode now
    let pLat = pickupLat, pLng = pickupLng;
    if (!pLat || !pLng) {
      try {
        const coords = await getCoordinates(pickup);
        pLat = coords[1]; pLng = coords[0];
      } catch { /* coords optional */ }
    }

    const load = await Load.create({
      pickup,
      drop,
      weight:        parseFloat(weight),
      urgency,
      cargo:         cargo || "General Goods",
      customerName:  customerName || "Guest",
      customerPhone: customerPhone || "0000000000",
      price:         parseFloat(price) || 0,
      distanceKm:    parseFloat(distanceKm) || 0,
      pickupLat:     pLat || null,
      pickupLng:     pLng || null,
      status:        "Pending",   // ← Pending, NOT Assigned
    });

    res.status(201).json({
      message: "Booking confirmed. Nearby drivers are being notified.",
      loadId: load._id,
    });
  } catch (err) {
    console.error("❌ Book error:", err.message);
    res.status(500).json({ error: "Failed to create booking." });
  }
});
// ── GET /load/:id — Customer polls this to check if driver accepted ──────────
router.get("/load/:id", async (req, res) => {
  try {
    const load = await Load.findById(req.params.id)
      .populate("assignedDriverId", "fullName phone location");
    if (!load) return res.status(404).json({ error: "Load not found" });
    res.json({
      _id:          load._id,
      pickup:       load.pickup,
      drop:         load.drop,
      weight:       load.weight,
      urgency:      load.urgency,
      price:        load.price,
      status:       load.status,
      createdAt:    load.createdAt,
      distanceKm:   load.distanceKm,
      driver: load.assignedDriverId ? {
        name:     load.assignedDriverId.fullName,
        phone:    load.assignedDriverId.phone,
        location: load.assignedDriverId.location,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /loads — All loads (driver's Loads page uses this) ───────────────────
router.get("/loads", async (req, res) => {
  try {
    const loads = await Load.find().sort({ createdAt: -1 }).limit(100);
    res.json(loads);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
