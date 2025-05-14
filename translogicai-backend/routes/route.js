const express = require("express");
const axios = require("axios");
const router = express.Router();

const DAPI_KEY = process.env.Directions_API_KEY;

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
  const { pickup, drop } = req.body;

  if (!pickup || !drop) {
    return res.status(400).json({ error: "Pickup and drop are required." });
  }

  try {
    const pickupCoords = await getCoordinates(pickup);
    const dropCoords = await getCoordinates(drop);

    const routeRes = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        coordinates: [pickupCoords, dropCoords],
      },
      {
        headers: {
          Authorization: DAPI_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const summary = routeRes.data.features?.[0]?.properties?.summary;
    const geometry = routeRes.data.features?.[0]?.geometry;

    res.json({
      start: {
        lat: pickupCoords[1],
        lng: pickupCoords[0],
      },
      end: {
        lat: dropCoords[1],
        lng: dropCoords[0],
      },
      summary: {
        distance_km: (summary.distance / 1000).toFixed(2),
        duration_min: Math.round(summary.duration / 60),
      },
      geometry,
    });
  } catch (err) {
    console.error("Routing error:", err.message);
    res.status(500).json({ error: "Failed to get route." });
  }
});

module.exports = router;
