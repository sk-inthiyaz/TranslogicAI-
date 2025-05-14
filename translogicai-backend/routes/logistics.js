const express = require("express");
const axios = require("axios");
const router = express.Router();
const calculatePrice = require("../utils/calculatePrice");
const getWeather = require("../utils/getWeather");

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
  const { pickup, drop, weight, urgency } = req.body;

  if (!pickup || !drop || !weight || !urgency) {
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

    res.json({
      reply,
      price,
      routeData: geometry,
      eta: Math.round(duration),
      carbon: (distance * 0.21).toFixed(2),
      vehicle: urgency === "High" ? "Bike" : "Van",
    });
  } catch (err) {
    console.error("❌ Error in logistics:", err.message);
    res.status(500).json({ reply: "Internal server error in logistics." });
  }
});

module.exports = router;
